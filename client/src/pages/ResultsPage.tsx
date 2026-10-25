import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Trophy,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Key,
  Shield,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { CaseResult, asset } from '@mystery/shared';
import { api } from '../lib/api';
import { RubberStamp } from '../components/common/RubberStamp';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [result, setResult] = useState<CaseResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResult = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await api.getResult(id);
      setResult(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load case outcome');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="font-display text-xl text-t1 tracking-wide uppercase">
          Unsealing the Case Dossier...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-surface border border-line rounded-card text-center space-y-4 shadow-panel">
        <AlertCircle className="w-8 h-8 text-danger mx-auto" />
        <h2 className="font-display text-2xl text-t1 uppercase">Verdict Not Available</h2>
        <p className="text-sm text-t2 font-sans">
          {error || 'This case has not been resolved with an accusation yet.'}
        </p>
        <Link
          to={id ? `/case/${id}` : '/'}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-button bg-primary text-onprimary font-semibold text-xs tracking-wider uppercase"
        >
          <span>Return to Investigation</span>
        </Link>
      </div>
    );
  }

  const { correct, culprit, motive, method, opportunity, score, deduction, timeline, allClues } = result;

  // Background per Section 9.6: solved vs failed
  const bgUrl = correct ? asset('BG_RESULT_SOLVED', 1920) : asset('BG_RESULT_FAILED', 1920);

  const roleBadges: Record<string, { label: string; bg: string; text: string }> = {
    incriminating: { label: 'Incriminating', bg: 'bg-danger/20 border-danger/50', text: 'text-danger' },
    exonerating: { label: 'Exonerating', bg: 'bg-success/20 border-success/50', text: 'text-success' },
    red_herring: { label: 'Red Herring', bg: 'bg-warning/20 border-warning/50', text: 'text-warning' },
    context: { label: 'Context', bg: 'bg-raised border-line', text: 'text-t3' },
  };

  return (
    <div
      className="page-bg page-overlay-results relative -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-10 min-h-screen"
      style={{
        '--bg-url': `url(${bgUrl})`,
        '--bg-overlay-top': '0.30',
        '--bg-overlay-bottom': '0.65',
      } as React.CSSProperties}
    >
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
        {/* Verdict Stamp & Headline */}
        <div className="text-center relative py-6 flex flex-col items-center">
          <div className="mb-4">
            <RubberStamp text={correct ? 'CASE SOLVED' : 'WRONG SUSPECT'} variant={correct ? 'solved' : 'failed'} />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl text-t1 uppercase tracking-wide mt-2">
            {correct ? (
              <span>Brilliant Deduction, <span className="text-primary">Detective</span></span>
            ) : (
              <span>The True Culprit <span className="text-danger">Escaped</span></span>
            )}
          </h1>
          <p className="text-sm text-t2 font-sans mt-2 max-w-lg">
            {correct
              ? 'Your forensic analysis and testimony evaluation successfully identified the guilty party.'
              : 'Your accusation fell on an innocent party. The real criminal managed to slip away.'}
          </p>
        </div>

        {/* Score Summary Box */}
        <div className="p-6 bg-surface/90 border border-line rounded-card shadow-panel backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
            <h3 className="font-display text-xl text-t1 uppercase tracking-wider flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-warning" />
              <span>Investigative Score Sheet</span>
            </h3>
            <div className="text-right">
              <span className="text-xs font-mono uppercase text-t3 block">Final Score</span>
              <span className="font-display text-3xl text-primary font-bold">{score.final} pts</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-raised/50 rounded-lg border border-line">
              <span className="text-[11px] font-mono uppercase text-t3 block">Base Points</span>
              <span className="font-display text-lg text-t1 font-bold">{score.base}</span>
            </div>
            <div className="p-3 bg-raised/50 rounded-lg border border-line">
              <span className="text-[11px] font-mono uppercase text-t3 block">Clue Bonus</span>
              <span className="font-display text-lg text-success font-bold">+{score.clueBonus}</span>
            </div>
            <div className="p-3 bg-raised/50 rounded-lg border border-line">
              <span className="text-[11px] font-mono uppercase text-t3 block">Hint Penalty</span>
              <span className="font-display text-lg text-danger font-bold">-{score.hintPenalty}</span>
            </div>
            <div className="p-3 bg-raised/50 rounded-lg border border-line">
              <span className="text-[11px] font-mono uppercase text-t3 block">Floor Applied</span>
              <span className="font-display text-lg text-t2">{score.floorApplied ? 'Yes' : 'None'}</span>
            </div>
          </div>
        </div>

        {/* The Truth Dossier: Culprit Reveal */}
        <div className="p-6 bg-surface/90 border border-line rounded-card shadow-panel backdrop-blur-md space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-line">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-display text-2xl text-t1 uppercase tracking-wide">
              The Confession & True Crime
            </h3>
          </div>

          <div className="p-4 bg-raised rounded-card border border-primary/40 space-y-2">
            <span className="text-[11px] font-mono uppercase text-primary font-bold">
              Guilty Perpetrator
            </span>
            <h4 className="font-display text-2xl text-t1 uppercase">
              {culprit.name}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-raised/40 rounded-card border border-line space-y-1.5">
              <span className="text-xs font-mono uppercase text-warning font-bold flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Motive</span>
              </span>
              <p className="text-xs text-t1 leading-relaxed font-sans">{motive}</p>
            </div>
            <div className="p-4 bg-raised/40 rounded-card border border-line space-y-1.5">
              <span className="text-xs font-mono uppercase text-primary font-bold flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Method</span>
              </span>
              <p className="text-xs text-t1 leading-relaxed font-sans">{method}</p>
            </div>
            <div className="p-4 bg-raised/40 rounded-card border border-line space-y-1.5">
              <span className="text-xs font-mono uppercase text-t2 font-bold flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Opportunity</span>
              </span>
              <p className="text-xs text-t1 leading-relaxed font-sans">{opportunity}</p>
            </div>
          </div>
        </div>

        {/* Deduction Chain */}
        {deduction && deduction.length > 0 && (
          <div className="p-6 bg-surface/90 border border-line rounded-card shadow-panel backdrop-blur-md space-y-4">
            <h3 className="font-display text-xl text-t1 uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span>Logical Chain of Deduction</span>
            </h3>
            <div className="space-y-3">
              {deduction.map((step) => (
                <div key={step.step} className="p-3.5 bg-raised/50 rounded-card border border-line flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-base border border-line flex items-center justify-center font-mono text-xs font-bold text-primary flex-shrink-0">
                    {step.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-t1 font-sans">{step.conclusion}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-t3">Evidence used:</span>
                      {step.clueIds.map((cid) => (
                        <span key={cid} className="text-[10px] font-mono px-2 py-0.5 rounded bg-base border border-line text-t2">
                          #{cid.toUpperCase()}
                        </span>
                      ))}
                      {step.playerFoundAllClues ? (
                        <span className="text-[10px] font-bold text-success ml-2">✓ You uncovered this</span>
                      ) : (
                        <span className="text-[10px] font-bold text-warning ml-2">⚠ Missed some clues</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* True Timeline */}
        {timeline && timeline.length > 0 && (
          <div className="p-6 bg-surface/90 border border-line rounded-card shadow-panel backdrop-blur-md space-y-4">
            <h3 className="font-display text-xl text-t1 uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>True Chronological Timeline</span>
            </h3>
            <div className="relative pl-6 border-l-2 border-primary/40 space-y-4 ml-2">
              {timeline.map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-base" />
                  <div className="bg-raised/40 p-3 rounded-lg border border-line">
                    <span className="font-mono text-xs font-bold text-primary block">{item.time}</span>
                    <p className="text-xs text-t1 mt-1 font-sans">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete Evidence Disclosure */}
        <div className="p-6 bg-surface/90 border border-line rounded-card shadow-panel backdrop-blur-md space-y-4">
          <h3 className="font-display text-xl text-t1 uppercase tracking-wider flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Complete Evidence Disclosure ({allClues.length})</span>
          </h3>
          <p className="text-xs text-t3">
            Every piece of evidence categorized by its true investigatory role:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allClues.map((clue) => {
              const badge = roleBadges[clue.role] || roleBadges.context;
              return (
                <div
                  key={clue.id}
                  className={`p-3.5 rounded-card border ${
                    clue.discovered ? 'bg-raised/70 border-line' : 'bg-base/60 border-line/50 opacity-80'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-t3">#{clue.id.toUpperCase()}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  <h5 className="font-display text-base text-t1 uppercase">{clue.title}</h5>
                  <p className="text-xs text-t2 leading-relaxed">{clue.description}</p>
                  <div className="pt-1 text-[11px] font-mono text-t3">
                    Status: {clue.discovered ? <strong className="text-success">Found by you</strong> : <strong className="text-warning">Undiscovered</strong>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/create"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-button bg-primary hover:bg-primary-hover text-onprimary font-semibold text-xs tracking-wider uppercase transition-all shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Investigate New Mystery</span>
          </Link>
          <Link
            to="/cases"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-button bg-surface hover:bg-raised text-t1 border border-line text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            <span>View Case History</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
