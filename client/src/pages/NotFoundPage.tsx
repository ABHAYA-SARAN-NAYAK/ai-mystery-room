import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { PageBackground } from '../components/layout/PageBackground';

export const NotFoundPage: React.FC = () => {
  return (
    <PageBackground
      bgId="BG_INVESTIGATION"
      className="page-overlay-investigation"
      overlayTop={0.45}
      overlayBottom={0.80}
    >
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto p-6 space-y-6 animate-fade-in py-16">
        <div className="p-4 rounded-full bg-raised border border-line text-primary">
          <FileQuestion className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
            Error 404 · Uncharted Territory
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-t1 uppercase tracking-wide">
            Cold Trail, Detective
          </h1>
          <p className="text-sm text-t2 font-sans leading-relaxed">
            The crime scene dossier or evidence file you are attempting to locate does not exist or has been permanently archived.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-button bg-primary hover:bg-primary-hover text-onprimary font-semibold text-xs tracking-wider uppercase transition-colors shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link
            to="/create"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-button bg-surface hover:bg-raised text-t1 border border-line font-semibold text-xs tracking-wider uppercase transition-colors"
          >
            <span>Start Mystery</span>
          </Link>
        </div>
      </div>
    </PageBackground>
  );
};
