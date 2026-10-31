import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: './server/.env' });

import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config/index';

function maskApiKey(key: string): string {
  if (!key) return '(not set)';
  return '***HIDDEN***';
}

function sanitizeText(text: string, apiKey: string): string {
  if (!apiKey) return text;
  return text.split(apiKey).join('***API_KEY***');
}

class DiagnosticGenAI extends GoogleGenAI {
  async fetchModelsList(): Promise<{ models?: Array<{ name: string; supportedGenerationMethods?: string[] }> }> {
    const response = await this.apiClient.request({
      path: 'models',
      httpMethod: 'GET',
    });
    return (await response.json()) as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> };
  }
}

export async function runGeminiDiagnostic(): Promise<boolean> {
  console.log('--- AI Mystery Room: Gemini Diagnostic ---');
  console.log(`Configured GEMINI_MODEL: ${config.geminiModel}`);
  console.log(`GEMINI_API_KEY: ${config.geminiApiKey ? 'CONFIGURED (' + maskApiKey(config.geminiApiKey) + ')' : 'MISSING'}`);

  if (!config.geminiApiKey) {
    console.error('FAIL: GEMINI_API_KEY is not configured in the environment.');
    return false;
  }

  const ai = new DiagnosticGenAI({
    apiKey: config.geminiApiKey,
    httpOptions: { timeout: 60000 },
  });

  // 1. List model names available to the key
  try {
    console.log('\nFetching available models from Gemini API...');
    const data = await ai.fetchModelsList();

    const models = data.models || [];
    const contentModels = models
      .filter((m) => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
      .map((m) => m.name.replace(/^models\//, ''));

    console.log(`Found ${models.length} total models (${contentModels.length} support generateContent).`);
    console.log('Available models supporting generateContent:');
    for (const name of contentModels) {
      const isCurrent = name === config.geminiModel || `models/${name}` === config.geminiModel;
      console.log(`  - ${name}${isCurrent ? '  <-- [CURRENT GEMINI_MODEL]' : ''}`);
    }

    const modelFound = contentModels.some(
      (name) => name === config.geminiModel || `models/${name}` === config.geminiModel
    );
    if (!modelFound) {
      console.warn(`\nWARNING: Configured model "${config.geminiModel}" was not found in the list of available models for this key!`);
    }
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const safeMsg = sanitizeText(rawMsg, config.geminiApiKey);
    console.error(`FAIL: Failed to list models: ${safeMsg}`);
    return false;
  }

  // 2. Send one tiny structured-JSON request (with retry for transient 503/429 spikes)
  console.log(`\nSending test structured JSON request using model "${config.geminiModel}"...`);
  const maxAttempts = 3;
  let lastErrorMsg = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`Retrying test request (attempt ${attempt}/${maxAttempts})...`);
      }

      const testResponse = await ai.models.generateContent({
        model: config.geminiModel,
        contents: 'Generate a JSON object with key "status" set to "OK".',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
            },
            required: ['status'],
          },
          thinkingConfig: {
            includeThoughts: false,
          },
        },
      });

      const text = testResponse.text || '';
      const parsed = JSON.parse(text) as { status?: string };

      if (parsed.status !== 'OK') {
        console.error(`FAIL: Structured JSON did not match expected schema. Received: ${text}`);
        return false;
      }

      console.log(`Response received successfully: ${JSON.stringify(parsed)}`);
      console.log('\nPASS: Gemini connection, model availability, and structured JSON generation verified.');
      return true;
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      lastErrorMsg = sanitizeText(rawMsg, config.geminiApiKey);

      const isTransient = /503|429|UNAVAILABLE|high demand|ETIMEDOUT|ECONNRESET|AbortError|aborted/i.test(lastErrorMsg);
      if (isTransient && attempt < maxAttempts) {
        console.warn(`Transient issue on attempt ${attempt} (${lastErrorMsg.slice(0, 100)}...). Backing off 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      console.error(`FAIL: Structured JSON generation failed: ${lastErrorMsg}`);
      return false;
    }
  }

  console.error(`FAIL: Structured JSON generation failed after ${maxAttempts} attempts: ${lastErrorMsg}`);
  return false;
}

// Direct execution
runGeminiDiagnostic()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Diagnostic error:', err);
    process.exit(1);
  });
