import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Filter,
  RefreshCw,
  AlertCircle,
  FileSearch,
} from 'lucide-react';
import { PublicCaseDetails, PublicDiscoveredClue, ClueType } from '@mystery/shared';
import { api } from '../lib/api';
import { PageBackground } from '../components/layout/PageBackground';
import { ClueCard } from '../components/case/ClueCard';
import { ClueDetailModal } from '../components/case/ClueDetailModal';
import { DifficultyBadge } from '../components/common/DifficultyBadge';
import { SuspectAvatar } from '../components/common/SuspectAvatar';

export const CluesTabPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [caseData, setCaseData] = useState<PublicCaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | ClueType>('all');
  const [selectedClue, setSelectedClue] = useState<PublicDiscoveredClue | null>(null);

  const fetchCase = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await api.getCase(id);
      if ('title' in data) {
        setCaseData(data);
        setError(null);

        // Check ?clue= query param
        const targetClueId = searchParams.get('clue');
        if (targetClueId) {
          const found = data.clues.find((c) => c.id === targetClueId && c.discovered) as PublicDiscoveredClue | undefined;
          if (found) setSelectedClue(found);
        }
      } else {
        // Still generating
        navigate(`/case/${id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, searchParams]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const handleDiscoverClue = async (clueId: string) => {
    if (!id) return;
    const res = await api.discoverClue(id, clueId);
    setSelectedClue(res.clue);
    setSearchParams({ clue: clueId });
    const updated = await api.getCase(id);
    if ('title' in updated) {
      setCaseData(updated);
    }
  };

  const handleInspect = (clue: PublicDiscoveredClue) => {
    setSelectedClue(clue);
    setSearchParams({ clue: clue.id });
  };

  const handleCloseModal = () => {
    setSelectedClue(null);
    searchParams.delete('clue');
    setSearchParams(searchParams);
  };

  if (isLoading && !caseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="font-display text-xl text-t1 tracking-wide uppercase">
          Cataloging Evidence...
        </p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-surface border border-line rounded-card text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-danger mx-auto" />
        <h2 className="font-display text-2xl text-t1 uppercase">Case Evidence Not Found</h2>
        <p className="text-sm text-t2 font-sans">{error || 'Unable to load evidence dossier'}</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-button bg-primary text-onprimary font-semibold text-xs tracking-wider uppercase"
        >
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  const { clues, progress, suspects } = caseData;
  const filteredClues = activeFilter === 'all'
    ? clues
    : clues.filter((c) => c.type === activeFilter);

  const discoveredClues = clues.filter((c) => c.discovered) as PublicDiscoveredClue[];
  const currentClueIndex = selectedClue ? discoveredClues.findIndex((c) => c.id === selectedClue.id) : -1;

  const filters: Array<{ id: 'all' | ClueType; label: string }> = [
    { id: 'all', label: 'All Evidence' },
    { id: 'physical', label: 'Physical' },
    { id: 'document', label: 'Documents' },
    { id: 'digital', label: 'Digital' },
    { id: 'testimony', label: 'Testimonies' },
  ];

  return (
    <PageBackground bgId="BG_INVESTIGATION">
      <div className="space-y-6 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 animate-fade-in">
        {/* Top Bar with Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-surface border border-line rounded-card shadow-panel">
          <div className="flex items-center space-x-3">
            <Link
              to={`/case/${id}`}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-raised hover:bg-raised/80 border border-line text-xs font-semibold text-t2 hover:text-t1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span>Case Board</span>
            </Link>
            <div>
              <h1 className="font-display text-2xl text-t1 uppercase tracking-wide flex items-center space-x-2">
                <FileSearch className="w-6 h-6 text-primary" />
                <span>Evidence Locker</span>
              </h1>
              <p className="text-xs text-t3">
                {caseData.title} · {progress.cluesDiscovered} of {clues.length} Discovered
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <DifficultyBadge difficulty={caseData.difficulty} />
            <div className="text-xs font-mono px-3 py-1.5 rounded bg-base border border-line text-t2">
              Discovered: <strong className="text-success">{progress.cluesDiscovered}</strong> / {clues.length}
            </div>
          </div>
        </div>

        {/* Main Grid: Left sidebar (case summary + suspects) & Right (filter + grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sidebar (3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            {/* Case Dossier Mini-card */}
            <div className="p-4 bg-surface border border-line rounded-card space-y-3 shadow-panel">
              <h3 className="font-display text-base text-t1 uppercase tracking-wider">
                Investigation Summary
              </h3>
              <p className="text-xs text-t2 leading-relaxed">
                Analyze physical traces, schedules, keycard logs, and witness accounts. Locked clues require uncovering prerequisite items first.
              </p>
              <div className="pt-2 border-t border-line space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-t3">Setting:</span>
                  <span className="text-t1 font-medium">{caseData.setting || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-t3">Date:</span>
                  <span className="text-t1 font-medium">{caseData.caseDate || 'Recent'}</span>
                </div>
              </div>
            </div>

            {/* Persons of Interest */}
            <div className="p-4 bg-surface border border-line rounded-card space-y-3 shadow-panel">
              <h3 className="font-display text-base text-t1 uppercase tracking-wider">
                Persons of Interest ({suspects.length})
              </h3>
              <div className="space-y-2">
                {suspects.map((suspect, idx) => (
                  <div
                    key={suspect.id}
                    onClick={() => navigate(`/case/${id}/suspects/${suspect.id}`)}
                    className="flex items-center space-x-2.5 p-2 rounded hover:bg-raised cursor-pointer border border-transparent hover:border-line transition-colors"
                  >
                    <SuspectAvatar suspect={suspect} index={idx} size="sm" />
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-display uppercase text-t1 truncate">{suspect.name}</p>
                      <p className="text-t3 text-[11px] truncate">{suspect.occupation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center / Right Evidence Locker (9 cols) */}
          <div className="lg:col-span-9 space-y-5">
            {/* Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              <Filter className="w-4 h-4 text-t3 ml-1 mr-1 flex-shrink-0" />
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    activeFilter === f.id
                      ? 'bg-primary text-onprimary border-primary shadow-sm'
                      : 'bg-surface text-t2 border-line hover:border-primary/50 hover:text-t1'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Evidence Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredClues.map((clue, idx) => (
                <ClueCard
                  key={clue.id}
                  clue={clue}
                  allClues={clues}
                  index={idx}
                  onDiscover={handleDiscoverClue}
                  onInspect={handleInspect}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Clue Detail Modal */}
        <ClueDetailModal
          clue={selectedClue}
          onClose={handleCloseModal}
          currentIndex={currentClueIndex}
          totalClues={discoveredClues.length}
          onNext={
            currentClueIndex < discoveredClues.length - 1
              ? () => {
                  const next = discoveredClues[currentClueIndex + 1];
                  setSelectedClue(next);
                  setSearchParams({ clue: next.id });
                }
              : undefined
          }
          onPrev={
            currentClueIndex > 0
              ? () => {
                  const prev = discoveredClues[currentClueIndex - 1];
                  setSelectedClue(prev);
                  setSearchParams({ clue: prev.id });
                }
              : undefined
          }
        />
      </div>
    </PageBackground>
  );
};
