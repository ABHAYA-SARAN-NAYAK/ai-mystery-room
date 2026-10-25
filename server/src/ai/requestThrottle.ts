import { config } from '../config/index';

// Process-local request pacing for the Gemini free tier.
// At 4.5s between starts, this service stays below a 15 RPM limit with a small buffer.
// This does not coordinate across multiple server instances or other apps using the same API project.
let scheduledStart: Promise<void> = Promise.resolve();
let lastRequestStartedAt = 0;

export async function waitForGeminiRequestSlot(): Promise<void> {
  let release!: () => void;
  const previous = scheduledStart;
  scheduledStart = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    const elapsedMs = Date.now() - lastRequestStartedAt;
    const waitMs = Math.max(0, config.geminiMinIntervalMs - elapsedMs);
    if (waitMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
    }
    lastRequestStartedAt = Date.now();
  } finally {
    release();
  }
}
