import React from 'react';
import { PageBackground } from '../components/layout/PageBackground';

export const HomePage: React.FC = () => {
  return (
    <PageBackground bgId="BG_HOME">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="font-display text-5xl">AI MYSTERY <span className="text-primary">ROOM</span></h1>
      </div>
    </PageBackground>
  );
};
