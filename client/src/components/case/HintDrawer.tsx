import React, { useState } from 'react';
import { X, Lightbulb, Lock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { PublicHint } from '@mystery/shared';

interface HintDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hints: PublicHint[];
  cluesDiscoveredCount: number;
  onUseHint: () => Promise<void>;
  isLoading?: boolean;
}

export const HintDrawer: React.FC<HintDrawerProps> = ({
  isOpen,
  onClose,
  hints,
  cluesDiscoveredCount,
  onUseHint,
  isLoading = false,
}) => {
  const [confirmingLevel, setConfirmingLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Find next available unlocked & unused hint
  const nextAvailableHint = hints.find((h) => !h.used && !h.locked);

  const handleConfirmUse = async () => {
    setError(null);
    try {
      await onUseHint();
      setConfirmingLevel(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request hint');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hint-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-base/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-surface border-l border-line shadow-panel flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-line bg-raised/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-warning/15 text-warning">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 id="hint-drawer-title" className="font-display text-xl text-t1 uppercase tracking-wide">
                Case Hints
              </h3>
              <p className="text-xs text-t3">Each used hint reduces your score by 10 points</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close hint drawer"
            className="p-1.5 rounded-lg text-t2 hover:text-t1 hover:bg-raised transition-colors focus:ring-2 focus:ring-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-danger/15 border border-danger/40 rounded-lg text-xs text-danger flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Hints List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {hints.map((hint) => {
            const isUsed = hint.used;
            const isLocked = hint.locked;
            const isNext = nextAvailableHint?.level === hint.level;

            if (isUsed) {
              return (
                <div
                  key={hint.level}
                  className="p-4 rounded-paper bg-hint text-ink shadow-panel border border-parchment-dark/70 space-y-2 relative"
                >
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink/75">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>Hint #{hint.level} (Used)</span>
                    </span>
                    <span className="text-[11px] font-mono text-danger">-10 pts</span>
                  </div>
                  <p className="font-sans text-sm text-ink font-medium leading-relaxed">
                    {hint.text}
                  </p>
                </div>
              );
            }

            if (isLocked) {
              const needed = Math.max(0, hint.unlockAtClues - cluesDiscoveredCount);
              return (
                <div
                  key={hint.level}
                  className="p-4 rounded-card bg-raised/40 border border-line/60 space-y-2 opacity-75"
                >
                  <div className="flex items-center justify-between text-xs font-mono uppercase text-t3">
                    <span className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-t3" />
                      <span>Hint #{hint.level} (Locked)</span>
                    </span>
                    <span className="text-[11px]">Unlocks at {hint.unlockAtClues} clues</span>
                  </div>
                  <p className="text-xs text-t3 leading-relaxed">
                    Find {needed} more clue{needed > 1 ? 's' : ''} to unlock this hint ({cluesDiscoveredCount}/{hint.unlockAtClues} discovered).
                  </p>
                </div>
              );
            }

            // Unlocked & Unused
            return (
              <div
                key={hint.level}
                className="p-4 rounded-card bg-raised border border-primary/40 space-y-3 shadow-panel"
              >
                <div className="flex items-center justify-between text-xs font-mono uppercase text-warning">
                  <span className="flex items-center space-x-1.5 font-bold">
                    <Lightbulb className="w-4 h-4" />
                    <span>Hint #{hint.level} (Available)</span>
                  </span>
                  <span className="text-[11px] font-semibold text-danger">-10 pts</span>
                </div>
                <p className="text-xs text-t2 leading-relaxed">
                  This hint is unlocked and ready to reveal investigative guidance.
                </p>

                {confirmingLevel === hint.level ? (
                  <div className="pt-2 border-t border-line/60 space-y-2">
                    <p className="text-xs text-warning font-medium">
                      Spend 10 points to reveal this hint now?
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleConfirmUse}
                        disabled={isLoading}
                        className="flex-1 py-2 px-3 rounded-button bg-primary hover:bg-primary-hover text-onprimary font-semibold text-xs flex items-center justify-center space-x-1 transition-colors disabled:opacity-40"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Confirm (-10)</span>
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmingLevel(null)}
                        className="py-2 px-3 rounded-button bg-surface border border-line text-t2 hover:text-t1 text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingLevel(hint.level)}
                    disabled={!isNext || isLoading}
                    className="w-full py-2.5 px-4 rounded-button bg-primary hover:bg-primary-hover text-onprimary font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-40"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Use Hint (-10 pts)</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
