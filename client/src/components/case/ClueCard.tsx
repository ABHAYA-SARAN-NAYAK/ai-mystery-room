import React, { useState } from 'react';
import { Lock, Check, Eye, FileText, UserCheck, Cpu, AlertCircle, Loader2, Search } from 'lucide-react';
import { PublicClue, PublicDiscoveredClue, ClueVisualKey, clueImage } from '@mystery/shared';

interface ClueCardProps {
  clue: PublicClue;
  allClues: PublicClue[];
  onDiscover: (clueId: string) => Promise<void>;
  onInspect: (clue: PublicDiscoveredClue) => void;
  index: number;
}

export const ClueCard: React.FC<ClueCardProps> = ({
  clue,
  allClues,
  onDiscover,
  onInspect,
  index,
}) => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  const isDiscovered = clue.discovered;

  // Check if clue requirements are satisfied
  const missingRequirements = (clue.requires || []).filter((reqId) => {
    const target = allClues.find((c) => c.id === reqId);
    return !target || !target.discovered;
  });
  const isRequirementLocked = !isDiscovered && missingRequirements.length > 0;

  const handleDiscover = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDiscovering || isRequirementLocked || isDiscovered) return;

    setDiscoverError(null);
    setIsDiscovering(true);
    try {
      await onDiscover(clue.id);
    } catch (err: unknown) {
      setDiscoverError(err instanceof Error ? err.message : 'Discovery failed');
    } finally {
      setIsDiscovering(false);
    }
  };

  const typeIcons = {
    physical: UserCheck,
    document: FileText,
    digital: Cpu,
    testimony: Eye,
  };
  const TypeIcon = typeIcons[clue.type] || FileText;

  // Discovered Clue View
  if (isDiscovered) {
    const discoveredClue = clue as PublicDiscoveredClue;
    const photoUrl = clueImage(discoveredClue.visualKey as ClueVisualKey, 400);

    return (
      <div
        onClick={() => onInspect(discoveredClue)}
        className="group cursor-pointer rounded-card bg-surface border border-line hover:border-primary/80 transition-all duration-300 overflow-hidden flex flex-col shadow-panel hover:shadow-selected relative"
      >
        {/* Top Image or Icon Backdrop */}
        <div className="relative h-32 w-full bg-base overflow-hidden">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={clue.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-raised/80">
              <TypeIcon className="w-10 h-10 text-t3 group-hover:text-primary transition-colors" />
            </div>
          )}

          {/* Green Discovered Badge */}
          <div className="absolute top-2.5 right-2.5 bg-success/90 backdrop-blur-sm text-onprimary text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>DISCOVERED</span>
          </div>

          {/* Clue Index */}
          <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded bg-base/80 text-[10px] font-mono text-t2 border border-line/60">
            CLUE #{index + 1}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 text-[11px] text-t3 uppercase font-semibold tracking-wider mb-1">
              <TypeIcon className="w-3 h-3 text-primary" />
              <span>{clue.type}</span>
              <span>·</span>
              <span className="truncate max-w-[120px]">{clue.location}</span>
            </div>
            <h3 className="font-display text-lg text-t1 group-hover:text-primary transition-colors line-clamp-1">
              {clue.title}
            </h3>
            <p className="text-xs text-t2 line-clamp-2 mt-1 leading-relaxed font-sans">
              {discoveredClue.description}
            </p>
          </div>

          <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs text-primary font-semibold">
            <span>Inspect Evidence</span>
            <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    );
  }

  // Locked Clue View
  return (
    <div className="rounded-card bg-surface/90 border border-line/80 p-4 flex flex-col justify-between space-y-4 shadow-md relative">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-[11px] text-t3 uppercase font-semibold">
            <TypeIcon className="w-3.5 h-3.5 text-t3" />
            <span>{clue.type}</span>
          </div>
          <span className="text-[10px] font-mono text-t3">CLUE #{index + 1}</span>
        </div>

        <h3 className="font-display text-lg text-t1/90 line-clamp-1 mb-1">
          {clue.title}
        </h3>

        <div className="text-xs text-t3 flex items-center space-x-1 mb-3">
          <span>Location:</span>
          <span className="text-t2 font-medium truncate">{clue.location}</span>
        </div>

        {/* Requires Warning if locked behind another clue */}
        {isRequirementLocked && (
          <div className="p-2 rounded bg-base/80 border border-line text-[11px] text-t3 flex items-start space-x-1.5 mb-2">
            <Lock className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
            <span>
              Unlocks after investigating: {missingRequirements.join(', ')}
            </span>
          </div>
        )}

        {discoverError && (
          <div className="text-xs text-danger flex items-center space-x-1 mb-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{discoverError}</span>
          </div>
        )}
      </div>

      <button
        onClick={handleDiscover}
        disabled={isDiscovering || isRequirementLocked}
        className="w-full py-2 px-3 bg-raised hover:bg-line border border-primary/40 hover:border-primary text-primary text-xs font-semibold rounded-btn transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
      >
        {isDiscovering ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Investigating...</span>
          </>
        ) : isRequirementLocked ? (
          <>
            <Lock className="w-3.5 h-3.5" />
            <span>Locked</span>
          </>
        ) : (
          <>
            <Search className="w-3.5 h-3.5" />
            <span>Investigate Clue (+5 pts)</span>
          </>
        )}
      </button>
    </div>
  );
};
