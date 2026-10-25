import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import {
  CreatePage,
  InvestigationRoomPage,
  CluesTabPage,
  SuspectProfilePage,
  ResultsPage,
  MyCasesPage,
  HowItWorksPage,
  AboutPage,
  NotFoundPage,
} from './pages/index';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'create', element: <CreatePage /> },
      { path: 'case/:id', element: <InvestigationRoomPage /> },
      { path: 'case/:id/clues', element: <CluesTabPage /> },
      { path: 'case/:id/suspects/:suspectId', element: <SuspectProfilePage /> },
      { path: 'case/:id/result', element: <ResultsPage /> },
      { path: 'cases', element: <MyCasesPage /> },
      { path: 'how-it-works', element: <HowItWorksPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
