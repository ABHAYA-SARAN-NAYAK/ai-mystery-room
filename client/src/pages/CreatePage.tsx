import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Pin, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import {
  Difficulty,
  DIFFICULTY_TIERS,
  SAMPLE_PREMISES,
  scene,
} from '@mystery/shared';
import { PageBackground } from '../components/layout/PageBackground';
import { DifficultyBadge } from '../components/common/DifficultyBadge';
import { api, ApiClientError } from '../lib/api';
import { useSessionStore } from '../store/sessionStore';

export const CreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSession, setGlobalError } = useSessionStore();

  const [premise, setPremise] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Pre-populate if query parameter ?sample=sample-X is passed
  useEffect(() => {
    const sampleParam = searchParams.get('sample');
    if (sampleParam) {
      const match = SAMPLE_PREMISES.find((s) => s.id === sampleParam);
      if (match) {
        setPremise(match.premise);
        setDifficulty(match.difficulty);
        setSelectedSampleId(match.id);
      }
    }
  }, [searchParams]);

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_PREMISES.find((s) => s.id === sampleId);
    if (sample) {
      setPremise(sample.premise);
      setDifficulty(sample.difficulty);
      setSelectedSampleId(sample.id);
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = premise.trim();

    if (trimmed.length < 10) {
      setValidationError('Please provide at least 10 characters describing your crime mystery.');
      return;
    }
    if (trimmed.length > 300) {
      setValidationError('Premise must not exceed 300 characters.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      const result = await api.createCase({
        premise: trimmed,
        difficulty,
      });

      // Find title if sample was picked
      const sampleMatch = SAMPLE_PREMISES.find((s) => s.id === selectedSampleId);
      const title = sampleMatch ? sampleMatch.title : 'New Investigation';

      setSession(result.caseId, result.sessionToken, {
        title,
        difficulty,
        status: 'generating',
      });

      navigate(`/case/${result.caseId}`);
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof ApiClientError) {
        if (err.code === 'DAILY_LIMIT_REACHED') {
          setValidationError('Daily mystery generation limit reached. Please come back tomorrow.');
        } else if (err.code === 'PREMISE_REJECTED') {
          setValidationError(err.message || 'Premise rejected by safety filters.');
        } else {
          setValidationError(err.message || 'Failed to initialize case.');
        }
      } else {
        setGlobalError({
          message: 'An unexpected connection error occurred. Please try again.',
          onRetry: () => handleSubmit(e),
        });
      }
    }
  };

  const selectedTierConfig = DIFFICULTY_TIERS[difficulty];

  return (
    <PageBackground bgId="BG_CREATE">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col space-y-12">
        {/* Page Heading */}
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary-soft border border-primary/40 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generative Detective Chamber</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl text-t1 tracking-tight">
            CREATE YOUR <span className="text-primary">MYSTERY</span>
          </h1>
          <p className="text-sm sm:text-base text-t2 max-w-2xl mt-1">
            Specify a crime scene premise and select your difficulty tier. Our fair-play puzzle engine
            will construct suspects, evidence chains, and logical alibis.
          </p>
        </div>

        {/* Main Grid: Form on Left (8 cols), Pinned Panel on Right (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (8 Columns) */}
          <div className="lg:col-span-8 bg-surface/90 border border-line rounded-card p-6 sm:p-8 backdrop-blur-xl shadow-panel">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-8">
              {/* Premise Textarea Section */}
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="premise" className="text-sm font-semibold text-t1">
                    Mystery Premise <span className="text-primary">*</span>
                  </label>
                  <span
                    className={`text-xs font-mono ${
                      premise.length > 300
                        ? 'text-danger font-bold'
                        : premise.length >= 10
                        ? 'text-success'
                        : 'text-t3'
                    }`}
                  >
                    {premise.length} / 300 characters
                  </span>
                </div>

                <textarea
                  id="premise"
                  rows={4}
                  value={premise}
                  onChange={(e) => {
                    setPremise(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="Describe the crime: location, what was stolen or who fell victim, and initial circumstances..."
                  className="w-full bg-base border border-line rounded-btn p-4 text-t1 placeholder-t3 text-sm leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary focus-ring transition-colors resize-none"
                />

                {validationError && (
                  <div className="flex items-center space-x-2 text-danger text-xs font-medium mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>

              {/* Sample Chips */}
              <div className="flex flex-col space-y-2">
                <span className="text-xs font-semibold text-t3 uppercase tracking-wider">
                  Quick Premise Ideas (Click to load):
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PREMISES.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSample(sample.id)}
                      disabled={isSubmitting}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-ring ${
                        selectedSampleId === sample.id
                          ? 'bg-primary-soft border-primary text-primary font-semibold'
                          : 'bg-base/70 border-line text-t2 hover:border-primary/50 hover:text-t1'
                      }`}
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selection Cards */}
              <div className="flex flex-col space-y-3 pt-2 border-t border-line">
                <label className="text-sm font-semibold text-t1">Select Difficulty Tier</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((tierKey) => {
                    const tier = DIFFICULTY_TIERS[tierKey];
                    const isSelected = difficulty === tierKey;

                    return (
                      <div
                        key={tierKey}
                        onClick={() => !isSubmitting && setDifficulty(tierKey)}
                        className={`cursor-pointer rounded-card p-4 border transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-raised border-primary shadow-selected ring-1 ring-primary'
                            : 'bg-base/60 border-line hover:border-line/90 hover:bg-base'
                        } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <DifficultyBadge difficulty={tierKey} />
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>

                        <div className="space-y-1.5 text-xs text-t2 mb-3">
                          <div className="flex justify-between">
                            <span>Suspects:</span>
                            <span className="text-t1 font-medium">{tier.suspects}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Clues to find:</span>
                            <span className="text-t1 font-medium">{tier.clues}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Hints available:</span>
                            <span className="text-t1 font-medium">{tier.hints}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Base points:</span>
                            <span className="text-t1 font-medium">+{tier.correctAccusationPoints}</span>
                          </div>
                        </div>

                        <span className="text-[11px] font-sans text-t3 border-t border-line/50 pt-2">
                          {tier.clueStyle}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-line flex items-center justify-between">
                <span className="text-xs text-t3 hidden sm:inline">
                  Generation typically completes in 5–15 seconds
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting || premise.trim().length < 10}
                  className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-hover active:bg-primary-press text-onprimary font-semibold text-sm rounded-btn transition-colors shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Mystery...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Mystery</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Pinned Case Settings (4 Columns on Desktop) */}
          <div className="lg:col-span-4 bg-surface/90 border border-line rounded-card p-6 backdrop-blur-xl relative">
            <div className="flex items-center space-x-2 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <Pin className="w-4 h-4" />
              <span>Investigation Blueprint</span>
            </div>

            <div className="space-y-4 text-sm text-t2 font-sans">
              <div className="p-3.5 rounded-lg bg-base border border-line flex flex-col space-y-1">
                <span className="text-xs text-t3 uppercase font-semibold">Active Tier</span>
                <span className="text-base text-t1 font-display tracking-wide uppercase">
                  {selectedTierConfig.label} Mode
                </span>
                <p className="text-xs text-t2">
                  Unlocks accusation after discovering{' '}
                  <span className="text-primary font-bold">
                    {selectedTierConfig.minCluesToAccuse} of {selectedTierConfig.clues}
                  </span>{' '}
                  clues.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-base border border-line flex flex-col space-y-2 text-xs">
                <span className="text-xs text-t3 uppercase font-semibold">Fair-Play Guarantee</span>
                <ul className="space-y-1.5 list-disc list-inside text-t2">
                  <li>Single guilty culprit with verifiable motive & means.</li>
                  <li>Innocent suspects clearable via alibis or evidence.</li>
                  <li>Evidence locked on server until discovery.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-base border border-line flex flex-col space-y-1">
                <span className="text-xs text-t3 uppercase font-semibold">Maximum Potential Score</span>
                <span className="text-2xl font-display text-primary leading-none">
                  {selectedTierConfig.maxScore} PTS
                </span>
                <span className="text-[11px] text-t3">
                  Base {selectedTierConfig.correctAccusationPoints} + Clues ({selectedTierConfig.clues} × 5)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: 6 Sample Premise Cards */}
        <div className="pt-8 border-t border-line">
          <h2 className="font-display text-3xl text-t1 mb-6">
            OR EXPLORE A <span className="text-primary">CLASSIC SCENARIO</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_PREMISES.map((sample) => (
              <div
                key={sample.id}
                onClick={() => handleSelectSample(sample.id)}
                className={`group cursor-pointer rounded-card border bg-surface/80 hover:bg-surface overflow-hidden flex flex-col transition-all duration-200 ${
                  selectedSampleId === sample.id
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-line hover:border-primary/50'
                }`}
              >
                <div className="h-36 w-full relative overflow-hidden bg-base">
                  <img
                    src={scene(sample.sceneKey, 640)}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2">
                    <DifficultyBadge difficulty={sample.difficulty} />
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl text-t1 group-hover:text-primary transition-colors mb-1.5">
                      {sample.title}
                    </h3>
                    <p className="text-xs text-t2 line-clamp-2 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>

                  <span className="text-xs text-primary font-semibold mt-4 inline-flex items-center space-x-1">
                    <span>Select Scenario</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageBackground>
  );
};
