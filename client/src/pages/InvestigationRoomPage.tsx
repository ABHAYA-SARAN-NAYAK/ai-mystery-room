import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  User,
  ShieldAlert,
  Lightbulb,
  FileSearch,
  Users,
  Compass,
  BookOpen,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PublicCaseDetails, PublicDiscoveredClue } from '@mystery/shared';
import { api } from '../lib/api';
import { useSessionStore } from '../store/sessionStore';
import { PageBackground } from '../components/layout/PageBackground';
import { DifficultyBadge } from '../components/common/DifficultyBadge';
import { ProgressRing } from '../components/common/ProgressRing';
import { SuspectCard } from '../components/case/SuspectCard';
import { ClueCard } from '../components/case/ClueCard';
import { ClueDetailModal } from '../components/case/ClueDetailModal';
import { HintDrawer } from '../components/case/HintDrawer';
import { AccuseModal } from '../components/case/AccuseModal';
import { GeneratingView } from '../components/case/GeneratingView';

type CaseState = PublicCaseDetails | { caseId: string; status: string; stage?: string };

export const InvestigationRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recordCase } = useSessionStore();

  const [caseData, setCaseData] = useState<CaseState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Panels
  const [selectedClue, setSelectedClue] = useState<PublicDiscoveredClue | null>(null);
  const [isHintDrawerOpen, setIsHintDrawerOpen] = useState(false);
  const [isAccuseModalOpen, setIsAccuseModalOpen] = useState(false);
  const [isSubmittingAccuse, setIsSubmittingAccuse] = useState(false);
  const [isUsingHint, setIsUsingHint] = useState(false);

  // Mobile active tab: 'briefing' | 'clues' | 'suspects' | 'progress'
  const [mobileTab, setMobileTab] = useState<'briefing' | 'clues' | 'suspects' | 'progress'>('briefing');

  const fetchCase = useCallback(async (isPolling = false) => {
    if (!id) return;
    if (!isPolling) setIsLoading(true);
    try {
      const data = await api.getCase(id);
      setCaseData(data);
      setError(null);

      // Record in session store if active or ready
      if ('title' in data) {
        recordCase({
          id: data.caseId,
          title: data.title,
          difficulty: data.difficulty,
          status: data.status,
        });

        // Redirect if already accused
        if (data.status === 'accused') {
          navigate(`/case/${data.caseId}/result`, { replace: true });
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  }, [id, navigate, recordCase]);

  // Initial load
  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  // Polling if status is 'generating'
  useEffect(() => {
    if (caseData?.status === 'generating') {
      const timer = setInterval(() => {
        fetchCase(true);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [caseData?.status, fetchCase]);

  // Cancel generation
  const handleCancelGeneration = async () => {
    if (!id) return;
    try {
      await api.cancelCase(id);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    }
  };

  // Discover clue handler
  const handleDiscoverClue = async (clueId: string) => {
    if (!id) return;
    const res = await api.discoverClue(id, clueId);
    setSelectedClue(res.clue);
    // Refresh full case details
    const updated = await api.getCase(id);
    setCaseData(updated);
  };

  // Use hint handler
  const handleUseHint = async (): Promise<void> => {
    if (!id) return;
    setIsUsingHint(true);
    try {
      await api.useHint(id);
      // Refresh case to reflect hint state
      const updated = await api.getCase(id);
      setCaseData(updated);
    } finally {
      setIsUsingHint(false);
    }
  };

  // Confirm accusation
  const handleAccuse = async (suspectId: string, reasoning: string) => {
    if (!id) return;
    setIsSubmittingAccuse(true);
    try {
      const res = await api.accuse(id, { suspectId, reasoning });
      recordCase({
        id,
        title: 'title' in (caseData || {}) ? (caseData as PublicCaseDetails).title : 'Mystery Case',
        difficulty: 'difficulty' in (caseData || {}) ? (caseData as PublicCaseDetails).difficulty : 'medium',
        status: 'accused',
        finalScore: res.score.final,
      });
      navigate(`/case/${id}/result`);
    } finally {
      setIsSubmittingAccuse(false);
    }
  };

  if (isLoading && !caseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="font-display text-xl text-t1 tracking-wide uppercase">
          Opening Investigation Dossier...
        </p>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-surface border border-line rounded-card text-center space-y-4 shadow-panel">
        <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-display text-2xl text-t1 uppercase">Case File Inaccessible</h2>
        <p className="text-sm text-t2 font-sans">{error}</p>
        <Link
          to="/create"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-button bg-primary text-onprimary font-semibold text-xs tracking-wider uppercase"
        >
          <span>Start New Mystery</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (!caseData) return null;

  // If status is generating, show the generating view
  if (caseData.status === 'generating') {
    return (
      <GeneratingView
        caseId={caseData.caseId}
        stage={'stage' in caseData ? caseData.stage || 'scene' : 'scene'}
        onCancel={handleCancelGeneration}
      />
    );
  }

  // If status is failed or abandoned
  if (caseData.status === 'failed' || caseData.status === 'abandoned') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-surface border border-line rounded-card text-center space-y-4 shadow-panel">
        <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-display text-2xl text-t1 uppercase">Case Closed — {caseData.status}</h2>
        <p className="text-sm text-t2 font-sans">
          This investigation was cancelled or encountered an unresolvable error during case compilation.
        </p>
        <Link
          to="/create"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-button bg-primary text-onprimary font-semibold text-xs tracking-wider uppercase"
        >
          <span>Create Another Mystery</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (!('title' in caseData)) return null;

  const { title, caseDate, setting, victim, difficulty, suspects, clues, hints, progress } = caseData;
  const cluesNeeded = progress.cluesNeededToAccuse;
  const canAccuse = cluesNeeded === 0;

  // Selected clue indexing
  const discoveredClues = clues.filter((c) => c.discovered) as PublicDiscoveredClue[];
  const currentClueIndex = selectedClue ? discoveredClues.findIndex((c) => c.id === selectedClue.id) : -1;

  return (
    <PageBackground bgId="BG_INVESTIGATION">
      <div className="space-y-6 animate-fade-in max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {/* Case Header */}
        <div className="p-6 bg-surface/90 border border-line rounded-card backdrop-blur-md shadow-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={difficulty} />
              {caseDate && (
                <span className="flex items-center space-x-1 text-xs text-t3 bg-base px-2.5 py-1 rounded border border-line">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{caseDate}</span>
                </span>
              )}
              {setting && (
                <span className="flex items-center space-x-1 text-xs text-t3 bg-base px-2.5 py-1 rounded border border-line">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{setting}</span>
                </span>
              )}
              {victim && (
                <span className="flex items-center space-x-1 text-xs text-t2 bg-base px-2.5 py-1 rounded border border-line">
                  <User className="w-3.5 h-3.5 text-danger" />
                  <span>Victim: <strong className="text-t1">{victim.name}</strong></span>
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl text-t1 uppercase tracking-wide">
              {title}
            </h1>
          </div>

          {/* Action quick-bar */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsHintDrawerOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-button bg-surface border border-line hover:border-warning/60 text-xs font-semibold text-t1 hover:text-warning transition-all"
            >
              <Lightbulb className="w-4 h-4 text-warning" />
              <span>Hints ({progress.hintsUsed}/{progress.hintsTotal})</span>
            </button>
            <button
              onClick={() => setIsAccuseModalOpen(true)}
              disabled={!canAccuse}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-button text-xs font-semibold uppercase tracking-wider transition-all shadow-md ${
                canAccuse
                  ? 'bg-primary hover:bg-primary-hover text-onprimary animate-pulse'
                  : 'bg-raised text-t3 border border-line cursor-not-allowed opacity-60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{canAccuse ? 'Accuse Culprit' : `Accuse (${cluesNeeded} more)`}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tab Bar */}
        <div className="border-b border-line pb-3">
          {/* Desktop Tabs */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex items-center space-x-2 py-2 text-primary font-bold text-sm border-b-2 border-primary">
              <FileSearch className="w-4 h-4" />
              <span>Case Board</span>
            </div>
            <Link
              to={`/case/${id}/clues`}
              className="flex items-center space-x-2 py-2 text-t2 hover:text-t1 text-sm transition-colors"
            >
              <span>Clues ({clues.length})</span>
            </Link>
            {/* Disabled Map & Notes tabs per Section 10.6 */}
            <div className="flex items-center space-x-1.5 py-2 text-t3 text-sm cursor-not-allowed select-none opacity-60">
              <Compass className="w-4 h-4" />
              <span>Map</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-raised border border-line text-t3">
                Soon
              </span>
            </div>
            <div className="flex items-center space-x-1.5 py-2 text-t3 text-sm cursor-not-allowed select-none opacity-60">
              <BookOpen className="w-4 h-4" />
              <span>Notes</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-raised border border-line text-t3">
                Soon
              </span>
            </div>
          </div>

          {/* Mobile Viewport Section Switcher */}
          <div className="flex lg:hidden items-center justify-between w-full bg-raised p-1 rounded-lg border border-line text-xs">
            <button
              onClick={() => setMobileTab('briefing')}
              className={`flex-1 py-1.5 text-center rounded transition-colors ${
                mobileTab === 'briefing' ? 'bg-primary text-onprimary font-bold shadow-sm' : 'text-t2 hover:text-t1'
              }`}
            >
              Briefing
            </button>
            <button
              data-testid="mobile-tab-clues"
              onClick={() => setMobileTab('clues')}
              className={`flex-1 py-1.5 text-center rounded transition-colors ${
                mobileTab === 'clues' ? 'bg-primary text-onprimary font-bold shadow-sm' : 'text-t2 hover:text-t1'
              }`}
            >
              Clues ({progress.cluesDiscovered})
            </button>
            <button
              onClick={() => setMobileTab('suspects')}
              className={`flex-1 py-1.5 text-center rounded transition-colors ${
                mobileTab === 'suspects' ? 'bg-primary text-onprimary font-bold shadow-sm' : 'text-t2 hover:text-t1'
              }`}
            >
              Suspects
            </button>
            <button
              onClick={() => setMobileTab('progress')}
              className={`flex-1 py-1.5 text-center rounded transition-colors ${
                mobileTab === 'progress' ? 'bg-primary text-onprimary font-bold shadow-sm' : 'text-t2 hover:text-t1'
              }`}
            >
              Progress
            </button>
          </div>
        </div>

        {/* Main 3-Column Desk Grid (Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Suspects List (3 cols / ~300px) */}
          <div className={`lg:col-span-3 space-y-4 ${mobileTab === 'suspects' ? 'block' : 'hidden lg:block'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="font-display text-xl text-t1 uppercase tracking-wide flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Suspects ({suspects.length})</span>
              </h3>
              <span className="text-xs text-t3 font-mono">1 Culprit</span>
            </div>
            <div className="space-y-3">
              {suspects.map((suspect, idx) => (
                <SuspectCard
                  key={suspect.id}
                  suspect={suspect}
                  index={idx}
                  onClick={() => navigate(`/case/${id}/suspects/${suspect.id}`)}
                />
              ))}
            </div>
          </div>

          {/* Column 2: Briefing Paper & Clues Grid (6 cols / Center Desk) */}
          <div
            className={`lg:col-span-6 space-y-6 ${
              mobileTab === 'briefing' || mobileTab === 'clues' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Briefing Paper */}
            <div
              className={`relative p-6 sm:p-7 rounded-paper bg-parchment text-ink shadow-panel border border-parchment-dark/70 rotate-[-0.5deg] ${
                mobileTab === 'clues' ? 'hidden sm:block' : 'block'
              }`}
            >
              <div className="absolute -top-3 left-8 w-6 h-6 rounded-full bg-danger shadow-md border-2 border-white/80" />
              <h2 className="font-display text-2xl text-ink uppercase tracking-wide mb-2">
                Official Crime Dossier
              </h2>
              <p className="font-sans text-sm text-ink/90 leading-relaxed font-medium">
                {caseData.briefing}
              </p>
              {victim && (
                <div className="mt-4 pt-3 border-t border-parchment-dark/50 text-xs text-ink/80 flex items-start space-x-2">
                  <span className="font-bold uppercase tracking-wider text-ink">Victim File:</span>
                  <span>{victim.name} — {victim.summary}</span>
                </div>
              )}
            </div>

            {/* Clues Section */}
            <div className={`space-y-4 ${mobileTab === 'briefing' ? 'hidden sm:block' : 'block'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div className="flex items-center space-x-2">
                  <h3 className="font-display text-xl text-t1 uppercase tracking-wide">
                    Crime Scene Evidence ({progress.cluesDiscovered}/{clues.length})
                  </h3>
                </div>
                <span className="text-xs text-t3">
                  Click a discovered card to inspect photo & clues
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clues.map((clue, idx) => (
                  <ClueCard
                    key={clue.id}
                    clue={clue}
                    allClues={clues}
                    index={idx}
                    onDiscover={handleDiscoverClue}
                    onInspect={(discovered) => setSelectedClue(discovered)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Progress & Detective Dossier (3 cols / ~300px) */}
          <div className={`lg:col-span-3 space-y-6 ${mobileTab === 'progress' ? 'block' : 'hidden lg:block'}`}>
            {/* Progress Ring Card */}
            <div className="p-6 bg-surface border border-line rounded-card shadow-panel flex flex-col items-center text-center">
              <h4 className="font-display text-lg text-t1 uppercase tracking-wider mb-4">
                Investigation Progress
              </h4>
              <ProgressRing
                current={progress.cluesDiscovered}
                total={clues.length}
                size={170}
                hintsUsed={progress.hintsUsed}
                scorePreview={progress.scorePreview}
              />
            </div>

            {/* Accusation Status Card */}
            <div className="p-5 bg-surface border border-line rounded-card shadow-panel space-y-4">
              <div className="flex items-center space-x-2.5">
                <ShieldAlert className={`w-5 h-5 ${canAccuse ? 'text-primary' : 'text-t3'}`} />
                <h4 className="font-display text-lg text-t1 uppercase">Case Accusation</h4>
              </div>

              {canAccuse ? (
                <div className="space-y-3">
                  <p className="text-xs text-success leading-relaxed">
                    Minimum evidence threshold reached! You are authorized to formally accuse a suspect.
                  </p>
                  <button
                    onClick={() => setIsAccuseModalOpen(true)}
                    className="w-full py-3 px-4 rounded-button bg-primary hover:bg-primary-hover text-onprimary font-semibold text-xs tracking-wider uppercase transition-all shadow-md animate-pulse"
                  >
                    Accuse Primary Suspect
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-t3 leading-relaxed">
                    You need to discover <strong>{cluesNeeded} more clue{cluesNeeded > 1 ? 's' : ''}</strong> before making a formal accusation.
                  </p>
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-button bg-raised text-t3 border border-line text-xs font-semibold uppercase tracking-wider opacity-60 cursor-not-allowed"
                  >
                    Accuse Locked ({cluesNeeded} left)
                  </button>
                </div>
              )}
            </div>

            {/* Quick Hint Card */}
            <div className="p-5 bg-surface border border-line rounded-card shadow-panel space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-base text-t1 uppercase flex items-center space-x-1.5">
                  <Lightbulb className="w-4 h-4 text-warning" />
                  <span>Detective Hints</span>
                </span>
                <span className="text-xs font-mono text-warning">
                  {progress.hintsUsed}/{progress.hintsTotal} used
                </span>
              </div>
              <p className="text-xs text-t3 leading-relaxed">
                Stuck on a contradiction? Review investigative hints to break the case open.
              </p>
              <button
                onClick={() => setIsHintDrawerOpen(true)}
                className="w-full py-2.5 px-3 rounded-button bg-raised border border-line hover:border-warning/50 text-t1 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-warning" />
                <span>Open Hint Drawer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clue Detail Modal */}
        <ClueDetailModal
          clue={selectedClue}
          onClose={() => setSelectedClue(null)}
          currentIndex={currentClueIndex}
          totalClues={discoveredClues.length}
          onNext={
            currentClueIndex < discoveredClues.length - 1
              ? () => setSelectedClue(discoveredClues[currentClueIndex + 1])
              : undefined
          }
          onPrev={
            currentClueIndex > 0
              ? () => setSelectedClue(discoveredClues[currentClueIndex - 1])
              : undefined
          }
        />

        {/* Hint Drawer */}
        <HintDrawer
          isOpen={isHintDrawerOpen}
          onClose={() => setIsHintDrawerOpen(false)}
          hints={hints}
          cluesDiscoveredCount={progress.cluesDiscovered}
          onUseHint={handleUseHint}
          isLoading={isUsingHint}
        />

        {/* Accuse Modal */}
        <AccuseModal
          isOpen={isAccuseModalOpen}
          onClose={() => setIsAccuseModalOpen(false)}
          suspects={suspects}
          onConfirmAccusation={handleAccuse}
          isLoading={isSubmittingAccuse}
        />
      </div>
    </PageBackground>
  );
};
