import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Code2, Lock, ArrowRight } from 'lucide-react';
import { PageBackground } from '../components/layout/PageBackground';

export const AboutPage: React.FC = () => {
  return (
    <PageBackground bgId="BG_INVESTIGATION">
      <div className="max-w-4xl mx-auto space-y-10 animate-fade-in px-4 sm:px-6 lg:px-8 py-10 pb-16">
        {/* Header */}
        <div className="p-8 bg-surface border border-line rounded-card shadow-panel text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-t1 uppercase tracking-wide">
            About <span className="text-primary">AI Mystery Room</span>
          </h1>
          <p className="text-sm text-t2 font-sans max-w-xl mx-auto">
            A procedural detective game engine bringing golden-age fair-play whodunits to life with large language models and airtight algorithmic secrecy.
          </p>
        </div>

        {/* Philosophy & Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 bg-surface border border-line rounded-card shadow-panel space-y-3">
            <div className="flex items-center space-x-2 text-primary font-bold text-sm uppercase font-mono">
              <Lock className="w-4 h-4" />
              <span>Zero-Leak Secrecy Architecture</span>
            </div>
            <p className="text-xs text-t2 font-sans leading-relaxed">
              Unlike trivial LLM games where prompts easily reveal answers via developer tools, AI Mystery Room enforces an airtight backend firewall. The secret culprit, motive, method, and deduction chain are stored under <code className="text-primary font-mono text-[11px]">select: false</code> in MongoDB. Allow-list serializers ensure no client response contains forbidden fields prior to accusation.
            </p>
          </div>

          <div className="p-6 bg-surface border border-line rounded-card shadow-panel space-y-3">
            <div className="flex items-center space-x-2 text-primary font-bold text-sm uppercase font-mono">
              <Sparkles className="w-4 h-4" />
              <span>Automated Solver Validation</span>
            </div>
            <p className="text-xs text-t2 font-sans leading-relaxed">
              Every case is passed through a 15-step syntactic and semantic validation pipeline including dependency cycle detection, clue reachability checks, and an independent solver pass that verifies unique solvability before presenting the case to the player.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="p-6 bg-surface border border-line rounded-card shadow-panel space-y-4">
          <div className="flex items-center space-x-2 text-t1 font-display text-2xl uppercase">
            <Code2 className="w-5 h-5 text-primary" />
            <span>Technology Stack</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-raised/50 rounded-lg border border-line space-y-1">
              <span className="font-mono text-primary font-bold uppercase block text-[11px]">Frontend</span>
              <span className="text-t1 font-medium">React 18 + Vite</span>
              <p className="text-t3 text-[11px]">Tailwind CSS, Zustand, TanStack Query</p>
            </div>
            <div className="p-3 bg-raised/50 rounded-lg border border-line space-y-1">
              <span className="font-mono text-primary font-bold uppercase block text-[11px]">Backend API</span>
              <span className="text-t1 font-medium">Node.js 20 + Express</span>
              <p className="text-t3 text-[11px]">Mongoose, Zod, Helmet, Rate Limiter</p>
            </div>
            <div className="p-3 bg-raised/50 rounded-lg border border-line space-y-1">
              <span className="font-mono text-primary font-bold uppercase block text-[11px]">AI Model</span>
              <span className="text-t1 font-medium">@google/genai SDK</span>
              <p className="text-t3 text-[11px]">Gemini 2.5 Flash + Structured Outputs</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <Link
            to="/create"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-button bg-primary hover:bg-primary-hover text-onprimary font-semibold text-xs tracking-wider uppercase transition-colors shadow-md"
          >
            <span>Begin Investigation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </PageBackground>
  );
};
