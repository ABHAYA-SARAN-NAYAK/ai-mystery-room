import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Check, Loader2, ArrowLeft } from 'lucide-react';
import { PublicSuspect } from '@mystery/shared';
import { SuspectAvatar } from '../common/SuspectAvatar';

interface AccuseModalProps {
  isOpen: boolean;
  onClose: () => void;
  suspects: PublicSuspect[];
  onConfirmAccusation: (suspectId: string, reasoning: string) => Promise<void>;
  isLoading?: boolean;
}

export const AccuseModal: React.FC<AccuseModalProps> = ({
  isOpen,
  onClose,
  suspects,
  onConfirmAccusation,
  isLoading = false,
}) => {
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedSuspect = suspects.find((s) => s.id === selectedSuspectId);
  const selectedIndex = suspects.findIndex((s) => s.id === selectedSuspectId);

  const handleSubmit = async () => {
    if (!selectedSuspectId) return;
    setError(null);
    try {
      await onConfirmAccusation(selectedSuspectId, reasoning);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Accusation failed');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accuse-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface border border-line rounded-card shadow-panel overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-raised/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-danger/15 text-danger">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id="accuse-modal-title" className="font-display text-xl text-t1 uppercase tracking-wide">
                Final Accusation
              </h2>
              <p className="text-xs text-t3">Formal indictment of the primary suspect</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close accusation dialog"
            className="p-1.5 rounded-lg text-t2 hover:text-t1 hover:bg-raised transition-colors focus:ring-2 focus:ring-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="mx-6 mt-4 p-3.5 bg-danger/15 border border-danger/40 rounded-lg text-xs text-t1 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-danger block uppercase tracking-wider text-[11px] mb-0.5">
              Warning: Irreversible Decision
            </span>
            <span>
              Once you confirm your accusation, the case is permanently closed. You cannot change your verdict or investigate further clues.
            </span>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-3 p-3 bg-danger/20 border border-danger/60 rounded-lg text-xs text-danger">
            {error}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 'pick' ? (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase text-t3 tracking-wider mb-2.5">
                  Select the Culprit
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {suspects.map((suspect, idx) => {
                    const isSelected = suspect.id === selectedSuspectId;
                    return (
                      <div
                        key={suspect.id}
                        onClick={() => setSelectedSuspectId(suspect.id)}
                        className={`flex items-center space-x-3 p-3 rounded-card border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-raised border-primary ring-1 ring-primary shadow-selected'
                            : 'bg-raised/40 border-line hover:border-line/80 hover:bg-raised/70'
                        }`}
                      >
                        <SuspectAvatar suspect={suspect} index={idx} size="sm" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-display text-sm text-t1 uppercase truncate">
                            {suspect.name}
                          </h4>
                          <p className="text-[11px] text-t3 truncate">
                            {suspect.occupation || 'Suspect'}
                          </p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-primary bg-primary' : 'border-line'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-onprimary stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase text-t3 tracking-wider">
                    Detective's Reasoning (Optional)
                  </label>
                  <span className="text-[11px] font-mono text-t3">
                    {reasoning.length}/500
                  </span>
                </div>
                <textarea
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value.slice(0, 500))}
                  placeholder="Explain why the evidence points to this suspect (e.g. contradicting timeline, missing keycard)..."
                  className="w-full h-24 p-3 bg-base border border-line rounded-input text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none resize-none font-sans"
                />
              </div>
            </>
          ) : (
            /* Review Step */
            <div className="space-y-4 py-2">
              <div className="p-4 bg-raised rounded-card border border-primary/50 flex items-center space-x-4">
                {selectedSuspect && (
                  <SuspectAvatar
                    suspect={selectedSuspect}
                    index={selectedIndex >= 0 ? selectedIndex : 0}
                    size="lg"
                  />
                )}
                <div>
                  <span className="text-[11px] font-mono uppercase text-primary font-bold">
                    Primary Accused
                  </span>
                  <h3 className="font-display text-2xl text-t1 uppercase tracking-wide">
                    {selectedSuspect?.name}
                  </h3>
                  <p className="text-xs text-t2">
                    {selectedSuspect?.occupation} · {selectedSuspect?.relationshipToVictim}
                  </p>
                </div>
              </div>

              {reasoning && (
                <div className="p-4 bg-base rounded-card border border-line">
                  <span className="text-xs font-semibold uppercase text-t3 tracking-wider block mb-1">
                    Your Case Theory:
                  </span>
                  <p className="text-xs text-t2 font-sans italic leading-relaxed">
                    "{reasoning}"
                  </p>
                </div>
              )}

              <p className="text-xs text-t3 text-center">
                Ready to file the charge? The secret truth, motive, opportunity, and your investigative score will be calculated immediately.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-raised/70">
          {step === 'confirm' ? (
            <>
              <button
                onClick={() => setStep('pick')}
                disabled={isLoading}
                className="flex items-center space-x-1.5 text-xs text-t2 hover:text-t1 px-3 py-2 rounded bg-surface border border-line transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="py-2.5 px-5 rounded-button bg-danger hover:bg-danger/90 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-md flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Confirm Accusation</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="text-xs text-t2 hover:text-t1 px-3 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!selectedSuspectId}
                className="py-2.5 px-6 rounded-button bg-primary hover:bg-primary-hover text-onprimary font-semibold text-xs tracking-wider uppercase transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
              >
                Review Accusation
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
