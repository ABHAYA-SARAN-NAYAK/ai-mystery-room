import React from 'react';
import { PageBackground } from '../components/layout/PageBackground';

export const CreatePage: React.FC = () => (
  <PageBackground bgId="BG_CREATE">
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl">CREATE YOUR <span className="text-primary">MYSTERY</span></h1>
    </div>
  </PageBackground>
);

export const InvestigationRoomPage: React.FC = () => (
  <PageBackground bgId="BG_INVESTIGATION">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl">INVESTIGATION <span className="text-primary">ROOM</span></h1>
    </div>
  </PageBackground>
);

export const CluesTabPage: React.FC = () => (
  <PageBackground bgId="BG_INVESTIGATION">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl">CASE <span className="text-primary">CLUES</span></h1>
    </div>
  </PageBackground>
);

export const SuspectProfilePage: React.FC = () => (
  <PageBackground bgId="BG_INVESTIGATION">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl">SUSPECT <span className="text-primary">DOSSIER</span></h1>
    </div>
  </PageBackground>
);

export const ResultsPage: React.FC = () => (
  <PageBackground bgId="BG_RESULT_SOLVED">
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl">CASE <span className="text-primary">VERDICT</span></h1>
    </div>
  </PageBackground>
);

export const MyCasesPage: React.FC = () => (
  <PageBackground bgId="BG_INVESTIGATION">
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl">MY CASE <span className="text-primary">FILES</span></h1>
    </div>
  </PageBackground>
);

export const HowItWorksPage: React.FC = () => (
  <PageBackground bgId="BG_INVESTIGATION">
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl">HOW IT <span className="text-primary">WORKS</span></h1>
    </div>
  </PageBackground>
);

export const AboutPage: React.FC = () => (
  <PageBackground bgId="BG_INVESTIGATION">
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl">ABOUT <span className="text-primary">PROJECT</span></h1>
    </div>
  </PageBackground>
);

export const NotFoundPage: React.FC = () => (
  <PageBackground bgId="BG_HOME">
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <h1 className="font-display text-7xl text-primary mb-4">404</h1>
      <p className="text-xl text-t2 mb-8">This case file has been redacted or does not exist.</p>
    </div>
  </PageBackground>
);
