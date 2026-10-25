import React from 'react';
import { Link } from 'react-router-dom';
import { asset } from '@mystery/shared';

export const Footer: React.FC = () => {
  const logoUrl = asset('LOGO_MARK', 128);

  return (
    <footer className="w-full bg-base/95 border-t border-line mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-auto object-contain mix-blend-lighten"
            />
            <span className="font-display text-2xl tracking-wide text-t1">
              AI MYSTERY <span className="text-primary">ROOM</span>
            </span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-t2">
            <Link to="/how-it-works" className="hover:text-t1 transition-colors">
              How it works
            </Link>
            <Link to="/about" className="hover:text-t1 transition-colors">
              About
            </Link>
            <Link to="/cases" className="hover:text-t1 transition-colors">
              Case Files
            </Link>
            <Link to="/create" className="text-primary hover:text-primary-hover font-medium">
              Start Mystery
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between text-xs text-t3 gap-4">
          <p>
            &copy; {new Date().getFullYear()} AI Mystery Room. Fair-play generative detective mysteries.
          </p>
          <p className="font-type text-t3">
            STATUS: ACTIVE INVESTIGATION · ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </footer>
  );
};
