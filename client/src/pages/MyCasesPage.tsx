import React from 'react';
import { Link } from 'react-router-dom';
import { FolderArchive, ArrowRight, Plus } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { DifficultyBadge } from '../components/common/DifficultyBadge';
import { PageBackground } from '../components/layout/PageBackground';

export const MyCasesPage: React.FC = () => {
  const { cases } = useSessionStore();

  return (
    <PageBackground
      bgId="BG_INVESTIGATION"
      className="page-overlay-investigation"
      overlayTop={0.45}
      overlayBottom={0.80}
    >
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in px-4 sm:px-6 lg:px-8 py-10 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-surface border border-line rounded-card shadow-panel">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-t1 uppercase tracking-wide flex items-center space-x-3">
              <FolderArchive className="w-8 h-8 text-primary" />
              <span>Detective Case Archive</span>
            </h1>
            <p className="text-xs text-t3 mt-1">
              History of past and active mystery investigations recorded in this browser session.
            </p>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-button bg-primary hover:bg-primary-hover text-onprimary font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Mystery</span>
          </Link>
        </div>

        {/* Cases List */}
        {cases.length === 0 ? (
          <div className="p-12 bg-surface border border-line rounded-card text-center space-y-4 shadow-panel">
            <FolderArchive className="w-12 h-12 text-t3 mx-auto" />
            <h2 className="font-display text-2xl text-t1 uppercase">No Mystery Dossiers Found</h2>
            <p className="text-sm text-t2 font-sans max-w-md mx-auto">
              You haven't opened any investigation files yet. Select a premise or craft your own crime scenario to begin.
            </p>
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-button bg-primary text-onprimary font-semibold text-xs tracking-wider uppercase shadow-md"
            >
              <span>Start Your First Mystery</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((c) => {
              const isFinished = c.status === 'accused';
              const targetUrl = isFinished ? `/case/${c.caseId}/result` : `/case/${c.caseId}`;

              return (
                <div
                  key={c.caseId}
                  className="p-5 bg-surface border border-line rounded-card shadow-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/60 transition-all group"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <DifficultyBadge difficulty={c.difficulty} />
                      <span className="text-xs font-mono uppercase text-t3">
                        Case #{c.caseId.slice(0, 8)}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          c.status === 'accused'
                            ? 'bg-success/20 text-success border-success/40'
                            : c.status === 'active'
                            ? 'bg-primary/20 text-primary border-primary/40'
                            : 'bg-raised text-t3 border-line'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <h3 className="font-display text-xl text-t1 uppercase tracking-wide group-hover:text-primary transition-colors truncate">
                      {c.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-4">
                    {typeof c.finalScore === 'number' && (
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase text-t3 block">Score</span>
                        <span className="font-display text-xl text-primary font-bold">
                          {c.finalScore} pts
                        </span>
                      </div>
                    )}

                    <Link
                      to={targetUrl}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-button bg-raised hover:bg-primary hover:text-onprimary border border-line text-xs font-semibold uppercase tracking-wider text-t1 transition-all"
                    >
                      <span>{isFinished ? 'View Result' : 'Resume'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageBackground>
  );
};
