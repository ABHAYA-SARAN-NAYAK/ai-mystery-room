import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { GlobalErrorBanner } from './GlobalErrorBanner';
import { Footer } from './Footer';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-base text-t1 font-sans selection:bg-primary selection:text-onprimary">
      <GlobalErrorBanner />
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
