import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Trophy, ArrowRight } from 'lucide-react';
import { PageBackground } from '../components/layout/PageBackground';

export const HowItWorksPage: React.FC = () => {
  return (
    <PageBackground bgId="BG_INVESTIGATION">
      <div className="max-w-4xl mx-auto space-y-10 animate-fade-in px-4 sm:px-6 lg:px-8 py-10 pb-16">
        {/* Header */}
        <div className="p-8 bg-surface border border-line rounded-card shadow-panel text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-2">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-t1 uppercase tracking-wide">
            How The <span className="text-primary">Mystery</span> Works
          </h1>
          <p className="text-sm text-t2 font-sans max-w-xl mx-auto">
            AI Mystery Room generates logically sound, fair-play detective cases powered by AI with multi-layer verification.
          </p>
        </div>

        {/* 4 Core Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 bg-surface border border-line rounded-card shadow-panel space-y-2">
            <span className="text-primary font-mono text-xs font-bold uppercase">Step 01</span>
            <h3 className="font-display text-xl text-t1 uppercase">1. Analyze Crime Dossier</h3>
            <p className="text-xs text-t2 font-sans leading-relaxed">
              Read the initial scene report, victim background, and the identities of each person of interest. Every suspect has a public alibi statement and personal connections.
            </p>
          </div>

          <div className="p-6 bg-surface border border-line rounded-card shadow-panel space-y-2">
            <span className="text-primary font-mono text-xs font-bold uppercase">Step 02</span>
            <h3 className="font-display text-xl text-t1 uppercase">2. Investigate Evidence</h3>
            <p className="text-xs text-t2 font-sans leading-relaxed">
              Examine physical clues, schedules, phone logs, and witness accounts. Some clues are locked behind prerequisite findings, forming an investigative trail.
            </p>
          </div>

          <div className="p-6 bg-surface border border-line rounded-card shadow-panel space-y-2">
            <span className="text-primary font-mono text-xs font-bold uppercase">Step 03</span>
            <h3 className="font-display text-xl text-t1 uppercase">3. Uncover Contradictions</h3>
            <p className="text-xs text-t2 font-sans leading-relaxed">
              Cross-check suspect alibi timelines against verified evidence. Innocent suspects tell the truth; the culprit's claims always conflict with the physical facts.
            </p>
          </div>

          <div className="p-6 bg-surface border border-line rounded-card shadow-panel space-y-2">
            <span className="text-primary font-mono text-xs font-bold uppercase">Step 04</span>
            <h3 className="font-display text-xl text-t1 uppercase">4. Deliver the Indictment</h3>
            <p className="text-xs text-t2 font-sans leading-relaxed">
              Once you discover enough clues, make your formal accusation. After accusing, the dossier unseals to reveal the culprit, true timeline, and full deduction steps.
            </p>
          </div>
        </div>

        {/* Difficulty & Scoring Matrix */}
        <div className="p-6 bg-surface border border-line rounded-card shadow-panel space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-line">
            <Trophy className="w-5 h-5 text-warning" />
            <h2 className="font-display text-2xl text-t1 uppercase tracking-wide">
              Difficulty Tier & Scoring Matrix
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-line text-t3 uppercase font-mono">
                  <th className="py-3 px-3">Difficulty</th>
                  <th className="py-3 px-3">Suspects</th>
                  <th className="py-3 px-3">Total Clues</th>
                  <th className="py-3 px-3">Clues Needed to Accuse</th>
                  <th className="py-3 px-3">Hints Available</th>
                  <th className="py-3 px-3">Base Points</th>
                  <th className="py-3 px-3">Max Possible Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                <tr>
                  <td className="py-3 px-3 font-bold text-success uppercase">Easy</td>
                  <td className="py-3 px-3 text-t1">3</td>
                  <td className="py-3 px-3 text-t1">5</td>
                  <td className="py-3 px-3 text-t1">3 clues</td>
                  <td className="py-3 px-3 text-t1">2 hints (unlock at 1, 3 clues)</td>
                  <td className="py-3 px-3 font-mono text-t1">100</td>
                  <td className="py-3 px-3 font-mono font-bold text-primary">125 pts</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-primary uppercase">Medium</td>
                  <td className="py-3 px-3 text-t1">4</td>
                  <td className="py-3 px-3 text-t1">7</td>
                  <td className="py-3 px-3 text-t1">4 clues</td>
                  <td className="py-3 px-3 text-t1">3 hints (unlock at 1, 3, 5 clues)</td>
                  <td className="py-3 px-3 font-mono text-t1">150</td>
                  <td className="py-3 px-3 font-mono font-bold text-primary">185 pts</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-danger uppercase">Hard</td>
                  <td className="py-3 px-3 text-t1">5</td>
                  <td className="py-3 px-3 text-t1">9</td>
                  <td className="py-3 px-3 text-t1">6 clues</td>
                  <td className="py-3 px-3 text-t1">3 hints (unlock at 2, 4, 6 clues)</td>
                  <td className="py-3 px-3 font-mono text-t1">200</td>
                  <td className="py-3 px-3 font-mono font-bold text-primary">245 pts</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-raised/50 rounded-lg border border-line text-xs space-y-1.5 text-t2">
            <p><strong className="text-t1">Clue Discovery Bonus:</strong> +5 points per clue uncovered.</p>
            <p><strong className="text-t1">Hint Penalty:</strong> -10 points deducted per hint used.</p>
            <p><strong className="text-t1">Wrong Accusation:</strong> Base points become 0. You only keep net clue bonus minus hint penalties (floor is 0).</p>
          </div>
        </div>

        {/* Fair-Play Guarantee */}
        <div className="p-6 bg-surface border border-line rounded-card shadow-panel space-y-3">
          <div className="flex items-center space-x-2 text-success font-semibold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>The Fair-Play Detective Guarantee</span>
          </div>
          <p className="text-xs text-t2 leading-relaxed">
            Every mystery in this system is strictly validated by an automated solver pass before you play. The case contains no supernatural twists, no unmentioned twin siblings, no hidden poisons unknown to science, and no psychic clues. All necessary clues exist within the room.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <Link
            to="/create"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-button bg-primary hover:bg-primary-hover text-onprimary font-semibold text-xs tracking-wider uppercase transition-colors shadow-md"
          >
            <span>Ready to Investigate? Create a Mystery</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </PageBackground>
  );
};
