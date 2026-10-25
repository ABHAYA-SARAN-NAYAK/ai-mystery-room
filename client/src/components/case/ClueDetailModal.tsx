import React, { useEffect } from 'react';
import { X, FileText, Cpu, Eye, UserCheck, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { PublicDiscoveredClue, ClueVisualKey, clueImage } from '@mystery/shared';

interface ClueDetailModalProps {
  clue: PublicDiscoveredClue | null;
  onClose: () => void;
  currentIndex?: number;
  totalClues?: number;
  onNext?: () => void;
  onPrev?: () => void;
}

export const ClueDetailModal: React.FC<ClueDetailModalProps> = ({
  clue,
  onClose,
  currentIndex = 0,
  totalClues = 0,
  onNext,
  onPrev,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  if (!clue) return null;

  const photoUrl = clueImage(clue.visualKey as ClueVisualKey, 800);

  const typeIcons = {
    physical: UserCheck,
    document: FileText,
    digital: Cpu,
    testimony: Eye,
  };
  const TypeIcon = typeIcons[clue.type] || FileText;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clue-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-surface border border-line rounded-card shadow-panel overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-raised/70">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono uppercase tracking-wider text-t3 bg-base px-2.5 py-1 rounded border border-line">
              {totalClues > 0 ? `Clue ${currentIndex + 1} of ${totalClues}` : `Clue ${clue.id}`}
            </span>
            <div className="flex items-center space-x-1.5 text-xs text-primary font-semibold uppercase">
              <TypeIcon className="w-4 h-4" />
              <span>{clue.type}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close clue details"
            className="p-1.5 rounded-lg text-t2 hover:text-t1 hover:bg-raised transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Photo with Tape */}
          {photoUrl ? (
            <div className="relative mx-auto max-w-md p-3 bg-[#EAE2D5] rounded shadow-2xl rotate-[-0.5deg]">
              {/* Tape Graphic */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-parchment/60 backdrop-blur-sm shadow-sm rotate-[1deg] border border-parchment-dark/40" />
              <img
                src={photoUrl}
                alt={clue.title}
                className="w-full h-64 object-cover rounded-sm shadow-inner"
              />
              <div className="mt-2 text-center font-hand text-ink text-base">
                Evidence item #{clue.id.toUpperCase()} — {clue.location}
              </div>
            </div>
          ) : (
            <div className="relative mx-auto max-w-md p-8 bg-raised/80 rounded border border-line flex flex-col items-center justify-center text-center space-y-2">
              <TypeIcon className="w-16 h-16 text-primary/60" />
              <span className="font-hand text-t2 text-lg">No photograph captured on scene</span>
            </div>
          )}

          {/* Title & Location */}
          <div className="space-y-1">
            <h2 id="clue-detail-title" className="font-display text-2xl text-t1 uppercase tracking-wide">
              {clue.title}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-t3">
              <span className="font-semibold text-t2">Location:</span>
              <span>{clue.location}</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-raised/40 p-4 rounded-lg border border-line/60">
            <p className="font-sans text-sm text-t1 leading-relaxed">
              {clue.description}
            </p>
          </div>

          {/* Insight / Sticky Note ("What this could mean?") */}
          {clue.insight && (
            <div className="relative p-5 bg-hint text-ink rounded-paper shadow-panel rotate-[1deg] border border-parchment-dark/70">
              <div className="absolute -top-2.5 right-6 w-16 h-5 bg-parchment/70 backdrop-blur-sm border border-parchment-dark/50 rotate-[-4deg]" />
              <div className="flex items-center space-x-2 mb-1.5 text-ink/80 text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>What this could mean?</span>
              </div>
              <p className="font-hand text-xl text-ink leading-snug">
                "{clue.insight}"
              </p>
            </div>
          )}
        </div>

        {/* Footer with Prev / Next Navigation */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-line bg-raised/70">
          <button
            onClick={onPrev}
            disabled={!onPrev}
            className="flex items-center space-x-1.5 text-xs text-t2 hover:text-t1 disabled:opacity-30 disabled:pointer-events-none transition-colors px-3 py-1.5 rounded bg-surface border border-line"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Clue</span>
          </button>
          <span className="text-xs text-t3 font-mono">
            {currentIndex + 1} / {totalClues}
          </span>
          <button
            onClick={onNext}
            disabled={!onNext}
            className="flex items-center space-x-1.5 text-xs text-t2 hover:text-t1 disabled:opacity-30 disabled:pointer-events-none transition-colors px-3 py-1.5 rounded bg-surface border border-line"
          >
            <span>Next Clue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
