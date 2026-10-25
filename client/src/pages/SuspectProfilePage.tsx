import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Clock,
  Network,
  Search,
  FileText,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  PublicCaseDetails,
  PublicDiscoveredClue,
  resolvePortrait,
  SUSPECT_RING_COLORS,
} from '@mystery/shared';
import { api } from '../lib/api';
import { PageBackground } from '../components/layout/PageBackground';
import { ClueDetailModal } from '../components/case/ClueDetailModal';

export const SuspectProfilePage: React.FC = () => {
  const { id, suspectId } = useParams<{ id: string; suspectId: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<PublicCaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'alibi' | 'connections' | 'clues'>('overview');
  const [selectedClue, setSelectedClue] = useState<PublicDiscoveredClue | null>(null);

  const fetchCase = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await api.getCase(id);
      if ('title' in data) {
        setCaseData(data);
        setError(null);
      } else {
        navigate(`/case/${id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  if (isLoading && !caseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="font-display text-xl text-t1 tracking-wide uppercase">
          Accessing Suspect Dossier...
        </p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-surface border border-line rounded-card text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-danger mx-auto" />
        <h2 className="font-display text-2xl text-t1 uppercase">Suspect File Not Found</h2>
        <p className="text-sm text-t2 font-sans">{error || 'Unable to open profile'}</p>
        <Link
          to={id ? `/case/${id}` : '/'}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-button bg-primary text-onprimary font-semibold text-xs tracking-wider uppercase"
        >
          <span>Return to Investigation</span>
        </Link>
      </div>
    );
  }

  const { suspects, clues } = caseData;
  const currentSuspect = suspects.find((s) => s.id === suspectId) || suspects[0];
  const suspectIndex = suspects.findIndex((s) => s.id === currentSuspect.id);

  // Styling attributes
  const ringColor = SUSPECT_RING_COLORS[suspectIndex % SUSPECT_RING_COLORS.length];
  const isEven = (suspectIndex + 1) % 2 === 0;
  const avatarUrl = resolvePortrait(currentSuspect);

  // Split name into white first name + orange last name
  const nameParts = currentSuspect.name.trim().split(' ');
  const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  // Related clues: ONLY discovered clues where mentionsSuspectIds includes this suspect
  const discoveredClues = clues.filter((c) => c.discovered) as PublicDiscoveredClue[];
  const relatedClues = discoveredClues.filter(
    (c) => c.mentionsSuspectIds && c.mentionsSuspectIds.includes(currentSuspect.id)
  );

  return (
    <PageBackground bgId="BG_INVESTIGATION">
      <div className="space-y-6 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 animate-fade-in">
        {/* Top Bar with Back Link */}
        <div className="flex items-center justify-between p-4 bg-surface border border-line rounded-card shadow-panel">
          <Link
            to={`/case/${id}`}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-raised hover:bg-raised/80 border border-line text-xs font-semibold text-t2 hover:text-t1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
            <span>Back to Case Board</span>
          </Link>
          <div className="text-xs text-t3 font-mono">
            Case: <strong className="text-t1">{caseData.title}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Suspect Switcher (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 bg-surface border border-line rounded-card space-y-3 shadow-panel">
              <h3 className="font-display text-lg text-t1 uppercase tracking-wider flex items-center space-x-2">
                <User className="w-4 h-4 text-primary" />
                <span>Persons of Interest</span>
              </h3>
              <div className="space-y-2">
                {suspects.map((s, idx) => {
                  const isActive = s.id === currentSuspect.id;
                  const sRing = SUSPECT_RING_COLORS[idx % SUSPECT_RING_COLORS.length];
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        navigate(`/case/${id}/suspects/${s.id}`);
                        setActiveTab('overview');
                      }}
                      className={`w-full flex items-center space-x-3 p-3 rounded-card border text-left transition-all ${
                        isActive
                          ? 'bg-raised border-primary shadow-selected'
                          : 'bg-surface border-line hover:border-line/80 hover:bg-raised/50'
                      }`}
                    >
                      <div
                        className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                        style={{
                          border: `2px solid ${sRing}`,
                          boxShadow: `0 0 10px ${sRing}33`,
                        }}
                      >
                        <img
                          src={resolvePortrait(s)}
                          alt={s.name}
                          className={`w-full h-full object-cover ${(idx + 1) % 2 === 0 ? '-scale-x-100' : ''}`}
                        />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-base rounded-full flex items-center justify-center text-[9px] font-bold text-t1 border border-line">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display uppercase text-sm text-t1 truncate">{s.name}</p>
                        <p className="text-t3 text-xs truncate">{s.occupation}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Suspect Profile & Tabs (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Hero Profile Card */}
            <div className="p-6 bg-surface border border-line rounded-card shadow-panel flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Polaroid Frame with Paper Clip */}
              <div className="relative p-3 bg-[#EAE2D5] rounded shadow-2xl rotate-[-1.5deg] flex-shrink-0">
                <div className="absolute -top-3.5 right-6 w-5 h-10 border-2 border-line/70 rounded-full shadow-sm bg-base/10" />
                <div
                  className="w-40 h-44 overflow-hidden rounded-sm bg-base"
                  style={{
                    border: `3px solid ${ringColor}`,
                    boxShadow: `0 0 16px ${ringColor}44`,
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={`Suspect ${suspectIndex + 1}: ${currentSuspect.name}`}
                    className={`w-full h-full object-cover ${isEven ? '-scale-x-100' : ''}`}
                  />
                </div>
                <div className="mt-2 text-center font-hand text-ink text-sm">
                  Suspect #{suspectIndex + 1} · File #{currentSuspect.id.toUpperCase()}
                </div>
              </div>

              {/* Suspect Meta & Sticky Statement */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <span className="text-[11px] font-mono uppercase text-t3 tracking-wider bg-raised px-2 py-0.5 rounded border border-line">
                    Person of Interest #{suspectIndex + 1}
                  </span>
                  <h1 className="font-display text-4xl uppercase tracking-wide mt-1">
                    <span className="text-t1">{firstName} </span>
                    {lastName && <span className="text-primary">{lastName}</span>}
                  </h1>
                  <p className="text-sm text-t2 font-medium">
                    {currentSuspect.occupation} {currentSuspect.age ? `· Age ${currentSuspect.age}` : ''}
                  </p>
                  <p className="text-xs text-t3">
                    Relationship to Victim: <strong className="text-t2">{currentSuspect.relationshipToVictim || 'None'}</strong>
                  </p>
                </div>

                {/* Public Statement Sticky Note */}
                {currentSuspect.publicStatement && (
                  <div className="relative p-4 bg-hint text-ink rounded-paper shadow-panel border border-parchment-dark/70 rotate-[0.5deg]">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-ink/70 mb-1">
                      Official Sworn Statement
                    </span>
                    <p className="font-hand text-xl text-ink leading-snug">
                      "{currentSuspect.publicStatement}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center space-x-2 border-b border-line pb-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-t2 hover:text-t1'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('alibi')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'alibi'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-t2 hover:text-t1'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Claimed Alibi</span>
              </button>
              <button
                onClick={() => setActiveTab('connections')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'connections'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-t2 hover:text-t1'
                }`}
              >
                <Network className="w-4 h-4" />
                <span>Connections</span>
              </button>
              <button
                onClick={() => setActiveTab('clues')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'clues'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-t2 hover:text-t1'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Related Evidence ({relatedClues.length})</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 bg-surface border border-line rounded-card shadow-panel">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-t3 tracking-wider mb-2">
                      Background History
                    </h4>
                    <p className="text-sm text-t1 font-sans leading-relaxed bg-raised/40 p-4 rounded-lg border border-line/60">
                      {currentSuspect.background || 'No prior record or background history available in dossier.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase text-t3 tracking-wider mb-2">
                      Observed Personality & Demeanor
                    </h4>
                    <p className="text-sm text-t1 font-sans leading-relaxed bg-raised/40 p-4 rounded-lg border border-line/60">
                      {currentSuspect.personality || 'Calm, cooperative during preliminary interrogation.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Claimed Alibi Tab */}
              {activeTab === 'alibi' && (
                <div className="space-y-6">
                  <div className="p-3 bg-raised border border-line rounded-lg text-xs text-warning flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      This is the suspect's self-reported timeline. Cross-reference with discovered keycard logs, CCTV, and physical traces.
                    </span>
                  </div>

                  {currentSuspect.alibiTimeline && currentSuspect.alibiTimeline.length > 0 ? (
                    <div className="relative pl-6 border-l-2 border-primary/50 space-y-6 my-4">
                      {currentSuspect.alibiTimeline.map((item, idx) => (
                        <div key={idx} className="relative group">
                          <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-base shadow-sm" />
                          <div className="bg-raised/50 p-3.5 rounded-lg border border-line">
                            <span className="font-mono text-xs font-bold text-primary block">
                              {item.time}
                            </span>
                            <p className="text-sm text-t1 mt-1">{item.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-t3 italic py-4">
                      No detailed timeline entered in file.
                    </p>
                  )}
                </div>
              )}

              {/* Connections Tab */}
              {activeTab === 'connections' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase text-t3 tracking-wider mb-2">
                    Known Interpersonal Ties
                  </h4>
                  {currentSuspect.connections && currentSuspect.connections.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentSuspect.connections.map((conn, idx) => {
                        const targetSuspect = suspects.find((s) => s.id === conn.suspectId);
                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-card bg-raised/60 border border-line space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-display text-sm uppercase text-t1">
                                {targetSuspect ? targetSuspect.name : conn.suspectId}
                              </span>
                              <span className="text-[11px] font-mono text-primary bg-base px-2 py-0.5 rounded border border-line">
                                {conn.label}
                              </span>
                            </div>
                            <p className="text-xs text-t2 font-sans leading-relaxed">
                              {conn.note}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-t3 italic py-4">
                      No significant personal relationships reported between this suspect and others.
                    </p>
                  )}
                </div>
              )}

              {/* Related Clues Tab (Discovered Only, mentionsSuspectIds) */}
              {activeTab === 'clues' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase text-t3 tracking-wider mb-2">
                    Discovered Evidence Mentioning this Suspect
                  </h4>

                  {relatedClues.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {relatedClues.map((clue) => (
                        <div
                          key={clue.id}
                          onClick={() => setSelectedClue(clue)}
                          className="p-4 rounded-card bg-raised/60 border border-line hover:border-primary/60 cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-primary uppercase">
                              #{clue.id.toUpperCase()} · {clue.type}
                            </span>
                            <span className="text-xs text-success font-semibold flex items-center space-x-1">
                              <span>Discovered</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </div>
                          <h5 className="font-display text-base uppercase text-t1 group-hover:text-primary transition-colors">
                            {clue.title}
                          </h5>
                          <p className="text-xs text-t2 line-clamp-2">
                            {clue.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-raised/30 rounded-lg border border-line/60 text-center space-y-2">
                      <Search className="w-6 h-6 text-t3 mx-auto" />
                      <p className="text-sm text-t2">
                        No discovered evidence currently mentions {currentSuspect.name}.
                      </p>
                      <p className="text-xs text-t3">
                        Investigate more locked clues from the Case Board to uncover connections.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clue Detail Modal if clicked */}
        <ClueDetailModal
          clue={selectedClue}
          onClose={() => setSelectedClue(null)}
        />
      </div>
    </PageBackground>
  );
};
