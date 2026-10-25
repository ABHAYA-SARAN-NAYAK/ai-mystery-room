import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, ShieldCheck, Lock, Search, Scale } from 'lucide-react';
import { SAMPLE_PREMISES, scene } from '@mystery/shared';
import { PageBackground } from '../components/layout/PageBackground';
import { DifficultyBadge } from '../components/common/DifficultyBadge';
import { Container } from '../components/Container';
import { useSessionStore } from '../store/sessionStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { activeCaseId } = useSessionStore();

  // SPEC 10.5: Home page displays 3 sample cards (#1, #5, #2)
  const homeSamples = [
    SAMPLE_PREMISES.find((s) => s.id === 'sample-1')!,
    SAMPLE_PREMISES.find((s) => s.id === 'sample-5')!,
    SAMPLE_PREMISES.find((s) => s.id === 'sample-2')!,
  ].filter(Boolean);

  const features = [
    {
      icon: ShieldCheck,
      title: 'Fair-Play Solvable',
      description: 'Every mystery is guaranteed solvable through clue synthesis alone, with exactly one guilty culprit.',
    },
    {
      icon: Lock,
      title: 'Zero-Leak Secrecy',
      description: 'The culprit identity and secret timeline remain strictly locked on the server until your accusation.',
    },
    {
      icon: Search,
      title: 'Interactive Case Board',
      description: 'Explore locked evidence chains, inspect suspect statements, and track alibi timelines.',
    },
    {
      icon: Scale,
      title: 'Standardized Scoring',
      description: 'Transparent scoring matrix rewarding thorough investigation while penalizing hint reliance.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Define the Crime',
      description: 'Select your preferred challenge tier and supply a unique crime premise or choose a pre-configured scenario.',
    },
    {
      number: '02',
      title: 'Investigate Clues',
      description: 'Examine suspect dossiers, unlock physical evidence, track timelines, and strategically utilize limited hints.',
    },
    {
      number: '03',
      title: 'Accuse the Culprit',
      description: 'Identify the perpetrator in a single decisive verdict to unlock the true deduction chain and case resolution.',
    },
  ];

  return (
    <PageBackground bgId="BG_HOME" className="page-overlay-home" overlayTop={0.30} overlayBottom={0.70}>
      <div className="w-full flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative w-full min-h-[75vh] flex items-center">
          {/* Readability gradient layer (CHANGE 2 rule 3) */}
          <div className="absolute inset-0 pointer-events-none hero-readability-overlay" />

          <Container className="relative z-10 py-16 md:py-20">
            <div className="w-full md:max-w-[720px] text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-soft border border-primary/40 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
                <span>Noir Detective Case Engine</span>
              </div>

              <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight text-t1 uppercase leading-none mb-6">
                Solve a mystery <span className="text-primary">no one has seen</span> before
              </h1>

              <p className="text-lg sm:text-xl text-t2 leading-relaxed mb-10 font-sans">
                Fresh, solvable detective mysteries generated on demand from your custom premise.
                Investigate suspects, unlock crime scene evidence, spend limited hints wisely,
                and unmask the true culprit.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/create"
                  className="flex items-center space-x-2 px-7 py-3.5 bg-primary hover:bg-primary-hover active:bg-primary-press text-onprimary font-semibold text-base rounded-btn transition-colors shadow-lg shadow-primary/25 focus-ring"
                >
                  <span>Start a Mystery</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                {activeCaseId ? (
                  <Link
                    to={`/case/${activeCaseId}`}
                    className="flex items-center space-x-2 px-6 py-3.5 bg-surface/90 hover:bg-raised text-primary border border-primary/50 rounded-btn font-semibold text-base transition-colors focus-ring"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume Active Case</span>
                  </Link>
                ) : (
                  <Link
                    to="/cases"
                    className="flex items-center space-x-2 px-6 py-3.5 bg-surface/80 hover:bg-raised text-t1 border border-line rounded-btn font-semibold text-base transition-colors focus-ring"
                  >
                    <span>View Past Files</span>
                  </Link>
                )}
              </div>
            </div>
          </Container>
        </section>

        {/* Feature Strip */}
        <section className="border-y border-line bg-surface/80 backdrop-blur-md py-12">
          <Container>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feat, index) => {
                const Icon = feat.icon;
                return (
                  <div key={index} className="flex flex-col space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-soft border border-primary/30 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-t1 text-base">{feat.title}</h3>
                    <p className="text-sm text-t2 leading-relaxed">{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Featured Case Files (SPEC 10.5 #1, #5, #2) */}
        <section className="py-20 w-full">
          <Container>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Pre-Configured Scenarios
                </span>
                <h2 className="font-display text-4xl sm:text-5xl text-t1 mt-1">
                  FEATURED <span className="text-primary">INVESTIGATIONS</span>
                </h2>
              </div>
              <Link
                to="/create"
                className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center space-x-1"
              >
                <span>Build Custom Case</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {homeSamples.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => navigate(`/create?sample=${sample.id}`)}
                  className="group cursor-pointer rounded-card bg-surface/90 border border-line hover:border-primary/60 transition-all duration-300 overflow-hidden flex flex-col shadow-panel hover:shadow-selected"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-base">
                    <img
                      src={scene(sample.sceneKey, 640)}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <DifficultyBadge difficulty={sample.difficulty} />
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-2xl text-t1 group-hover:text-primary transition-colors mb-2">
                        {sample.title}
                      </h3>
                      <p className="text-sm text-t2 line-clamp-3 leading-relaxed mb-6 font-sans">
                        {sample.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-line/60 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>Investigate Case</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* How It Works (3 Steps) */}
        <section className="py-20 bg-surface/50 border-t border-line">
          <Container>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Protocol
              </span>
              <h2 className="font-display text-4xl sm:text-5xl text-t1 mt-1">
                HOW THE <span className="text-primary">INVESTIGATION</span> WORKS
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {steps.map((st, i) => (
                <div
                  key={i}
                  className="p-8 rounded-card bg-base/80 border border-line flex flex-col space-y-4"
                >
                  <span className="font-display text-5xl text-primary/40 leading-none">
                    {st.number}
                  </span>
                  <h3 className="font-display text-2xl text-t1">{st.title}</h3>
                  <p className="text-sm text-t2 leading-relaxed">{st.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </div>
    </PageBackground>
  );
};
