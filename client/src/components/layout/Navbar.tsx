import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Play } from 'lucide-react';
import { asset } from '@mystery/shared';
import { useSessionStore } from '../../store/sessionStore';
import { Container } from '../Container';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { activeCaseId } = useSessionStore();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Create', path: '/create' },
    { label: 'Cases', path: '/cases' },
    { label: 'How it works', path: '/how-it-works' },
    { label: 'About', path: '/about' },
  ];

  const logoUrl = asset('LOGO_MARK', 128);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-base/90 border-b border-line backdrop-blur-md">
      <Container className="h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group focus-ring rounded-md py-1">
          <img
            src={logoUrl}
            alt="AI Mystery Room Logo"
            className="h-9 w-auto object-contain mix-blend-lighten"
          />
          <span className="font-display text-2xl sm:text-3xl tracking-wide text-t1 group-hover:text-primary transition-colors">
            AI MYSTERY <span className="text-primary">ROOM</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors relative py-1 focus-ring rounded ${
                isActive(link.path)
                  ? 'text-primary'
                  : 'text-t2 hover:text-t1'
              }`}
            >
              {link.label}
              {isActive(link.path) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-fadeIn" />
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {activeCaseId && location.pathname !== `/case/${activeCaseId}` && (
            <Link
              to={`/case/${activeCaseId}`}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary border border-primary/50 hover:border-primary rounded-btn transition-colors focus-ring"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Case</span>
            </Link>
          )}

          <Link
            to="/create"
            className="flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary-hover active:bg-primary-press text-onprimary font-semibold text-sm rounded-btn transition-colors shadow-lg shadow-primary/20 focus-ring"
          >
            <span>Start a Mystery</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-t2 hover:text-t1 focus-ring rounded-md"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </Container>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-line bg-surface/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-t2 hover:text-t1 hover:bg-raised'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-line flex flex-col space-y-2">
            {activeCaseId && (
              <Link
                to={`/case/${activeCaseId}`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold text-primary border border-primary rounded-btn"
              >
                Resume Active Case
              </Link>
            )}

            <Link
              to="/create"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 bg-primary hover:bg-primary-hover text-onprimary font-semibold text-sm rounded-btn shadow-md"
            >
              Start a Mystery
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
