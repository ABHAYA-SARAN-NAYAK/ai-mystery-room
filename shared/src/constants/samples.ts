import { Difficulty } from './difficulty';
import { SceneKey } from './assets';

export interface SamplePremise {
  id: string;
  title: string;
  description: string;
  premise: string;
  sceneKey: SceneKey;
  difficulty: Difficulty;
}

export const SAMPLE_PREMISES: SamplePremise[] = [
  {
    id: 'sample-1',
    title: 'A Jewel Theft at a Wedding',
    description: 'During the bustling reception at the mountain resort, the bride’s heirloom sapphire necklace vanishes from the locked bridal suite.',
    premise: 'A vintage sapphire necklace disappears from a locked suite during a lavish wedding celebration at a mountain resort.',
    sceneKey: 'mansion_resort',
    difficulty: 'medium',
  },
  {
    id: 'sample-2',
    title: 'A Missing Professor',
    description: 'The senior archivist of the historical campus library was found slumped over a rare manuscript with crucial pages torn out.',
    premise: 'A respected university professor and archivist is discovered unconscious in the restricted wing of the library with ancient papers missing.',
    sceneKey: 'campus_library',
    difficulty: 'easy',
  },
  {
    id: 'sample-3',
    title: 'A Strange Death at a Resort',
    description: 'A wealthy financier is found poisoned at midnight on a private dock overlooking the misty lake during an exclusive retreat.',
    premise: 'A reclusive tech billionaire collapses after a midnight toast at a luxury lakeside lodge with only close associates present.',
    sceneKey: 'lake_resort',
    difficulty: 'medium',
  },
  {
    id: 'sample-4',
    title: 'A Stolen Prototype',
    description: 'The experimental quantum battery was stolen from the high-security subterranean lab right before an international audit.',
    premise: 'A top-secret breakthrough prototype is extracted from a biometric vault inside an underground research facility without triggering alarms.',
    sceneKey: 'research_lab',
    difficulty: 'hard',
  },
  {
    id: 'sample-5',
    title: 'A Blackout on a Train',
    description: 'When the express passenger train plunges into a pitch-black tunnel through the pass, a courier’s briefcase is seized.',
    premise: 'During a sudden electrical blackout on a cross-country night express, an encrypted courier briefcase is stolen from first class.',
    sceneKey: 'night_train',
    difficulty: 'hard',
  },
  {
    id: 'sample-6',
    title: 'A Locked Room Mystery',
    description: 'A prominent attorney is found dead inside a study bolted from the inside, with the only key in his own pocket.',
    premise: 'An eccentric estate attorney is discovered dead in a study bolted firmly from within, with no obvious exit or weapon.',
    sceneKey: 'locked_study',
    difficulty: 'hard',
  },
];
