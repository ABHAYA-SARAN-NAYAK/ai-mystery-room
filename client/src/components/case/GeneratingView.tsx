import React, { useState, useEffect } from 'react';
import { Check, Loader2, XCircle, ShieldCheck, Lock, Sparkles, Scale } from 'lucide-react';
import { GenerationStage, SceneKey, scene } from '@mystery/shared';
import { PageBackground } from '../layout/PageBackground';
import { api } from '../../lib/api';

interface GeneratingViewProps {
  caseId: string;
  stage?: GenerationStage | string;
  sceneKey?: SceneKey;
  onCancel?: () => void;
  onCancelled?: () => void;
}

const STAGES: Array<{ key: GenerationStage; label: string; description: string }> = [
  { key: 'scene', label: 'Crime Scene Atmosphere', description: 'Establishing location, victim, and setting details.' },
  { key: 'suspects', label: 'Suspect Dossiers & Alibis', description: 'Drafting character profiles, alibi statements, and connections.' },
  { key: 'clues', label: 'Clue Distribution', description: 'Placing physical evidence, documents, and digital records.' },
  { key: 'hiding', label: 'Securing Secret Data', description: 'Sealing culprit identities and deduction trails server-side.' },
  { key: 'validating', label: 'Verifying Solvency', description: 'Running fair-play solvers to ensure case is 100% solvable.' },
];

export const GeneratingView: React.FC<GeneratingViewProps> = ({
  caseId,
  stage = 'scene',
  sceneKey = 'mansion_resort',
  onCancel,
  onCancelled,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await api.cancelCase(caseId);
      if (onCancel) onCancel();
      if (onCancelled) onCancelled();
    } catch {
      setIsCancelling(false);
    }
  };

  const currentStageIndex = STAGES.findIndex((s) => s.key === stage);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;
  const progressPercent = Math.min(100, Math.round(((activeIndex + 1) / STAGES.length) * 100));

  return (
    <PageBackground bgId="BG_GENERATING">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center flex-1">
        {/* Main Generating Card */}
        <div className="w-full bg-surface/95 border border-line rounded-card p-6 sm:p-10 shadow-panel backdrop-blur-xl relative overflow-hidden">
          {/* Thin Orange Progress Bar on Top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-line">
            <div
              className="h-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="text-center mb-8">
            <span className="text-xs uppercase font-semibold text-primary tracking-widest">
              AI Detective Engine
            </span>
            <h1 className="font-display text-4xl sm:text-5xl text-t1 mt-1">
              BUILDING YOUR <span className="text-primary">CASE FILE</span>
            </h1>
            <p className="text-sm text-t2 font-sans mt-2">
              Generating fair-play suspects, alibis, and verifiable evidence graph...
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-8">
            {/* Polaroid Scene Picture (md+) */}
            <div className="hidden md:flex md:col-span-5 flex-col items-center">
              <div className="p-3 bg-parchment rounded shadow-2xl transform -rotate-1 border border-parchment-dark w-full max-w-[260px]">
                <div className="h-44 w-full bg-base overflow-hidden rounded-sm">
                  <img
                    src={scene(sceneKey, 640)}
                    alt="Crime Scene Atmosphere"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-3 text-center">
                  <span className="font-hand text-lg text-ink">
                    Scene File #{caseId.substring(0, 6)}
                  </span>
                </div>
              </div>
            </div>

            {/* 5-Step Stepper (md: 7 cols) */}
            <div className="md:col-span-7 flex flex-col space-y-4">
              {STAGES.map((st, index) => {
                const isDone = index < activeIndex;
                const isActive = index === activeIndex;

                return (
                  <div key={st.key} className="flex items-start space-x-3.5">
                    {/* Step Icon */}
                    <div className="pt-0.5 shrink-0">
                      {isDone ? (
                        <div className="w-6 h-6 rounded-full bg-success/20 border border-success flex items-center justify-center text-success">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : isActive ? (
                        <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-line bg-base flex items-center justify-center text-t3 text-xs font-mono">
                          {index + 1}
                        </div>
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-sm font-semibold ${
                            isActive
                              ? 'text-primary'
                              : isDone
                              ? 'text-t1'
                              : 'text-t3'
                          }`}
                        >
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-t2 font-sans mt-0.5">
                        {st.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timer and Actions Footer */}
          <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-t2 font-mono">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>Elapsed Time: {elapsedSeconds}s (Usually under 20s)</span>
            </div>

            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-btn border border-line hover:border-danger/60 text-t2 hover:text-danger text-xs font-semibold transition-colors focus-ring disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isCancelling ? 'Cancelling...' : 'Cancel Generation'}</span>
            </button>
          </div>
        </div>

        {/* 4 Bottom Reassurance Blocks (SPEC 9.6 & 10.3) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 w-full">
          <div className="p-3.5 rounded-lg bg-surface/70 border border-line flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <span className="text-xs font-medium text-t2">Fair-Play Solvable</span>
          </div>
          <div className="p-3.5 rounded-lg bg-surface/70 border border-line flex items-center space-x-3">
            <Lock className="w-5 h-5 text-primary shrink-0" />
            <span className="text-xs font-medium text-t2">Zero-Leak Security</span>
          </div>
          <div className="p-3.5 rounded-lg bg-surface/70 border border-line flex items-center space-x-3">
            <Scale className="w-5 h-5 text-primary shrink-0" />
            <span className="text-xs font-medium text-t2">Single Culprit</span>
          </div>
          <div className="p-3.5 rounded-lg bg-surface/70 border border-line flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <span className="text-xs font-medium text-t2">Unique Evidence</span>
          </div>
        </div>
      </div>
    </PageBackground>
  );
};
