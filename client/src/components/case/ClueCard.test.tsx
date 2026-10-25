import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClueCard } from './ClueCard';
import { PublicLockedClue, PublicDiscoveredClue } from '@mystery/shared';

describe('ClueCard Component', () => {
  const mockLockedClue: PublicLockedClue = {
    id: 'c1',
    title: 'Torn Cloth',
    type: 'physical',
    location: 'Study Floor',
    discovered: false,
    locked: true,
    requires: [],
  };

  const mockDiscoveredClue: PublicDiscoveredClue = {
    id: 'c2',
    title: 'Secret Diary',
    type: 'document',
    location: 'Desk Drawer',
    discovered: true,
    locked: false,
    description: 'A leather-bound diary with torn pages.',
    visualKey: 'document_note',
    insight: 'Mentions a midnight meeting.',
    requires: [],
    mentionsSuspectIds: ['s1'],
  };

  it('renders locked clue with investigate action', () => {
    const handleDiscover = vi.fn().mockResolvedValue(undefined);
    const handleInspect = vi.fn();

    render(
      <ClueCard
        clue={mockLockedClue}
        allClues={[mockLockedClue]}
        onDiscover={handleDiscover}
        onInspect={handleInspect}
        index={0}
      />
    );

    expect(screen.getByText('Torn Cloth')).toBeDefined();
    expect(screen.getByText('Study Floor')).toBeDefined();
    expect(screen.getByText(/Investigate Clue/)).toBeDefined();

    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(handleDiscover).toHaveBeenCalledWith('c1');
  });

  it('renders requirement lock when prerequisite clues are not discovered', () => {
    const dependentClue: PublicLockedClue = {
      id: 'c3',
      title: 'Safe Combination',
      type: 'document',
      location: 'Wall Safe',
      discovered: false,
      locked: true,
      requires: ['c1'],
    };

    render(
      <ClueCard
        clue={dependentClue}
        allClues={[mockLockedClue, dependentClue]}
        onDiscover={vi.fn()}
        onInspect={vi.fn()}
        index={1}
      />
    );

    expect(screen.getByText('Safe Combination')).toBeDefined();
    expect(screen.getByText(/Unlocks after investigating:/)).toBeDefined();
  });

  it('renders discovered clue with DISCOVERED badge and triggers onInspect on click', () => {
    const handleInspect = vi.fn();

    render(
      <ClueCard
        clue={mockDiscoveredClue}
        allClues={[mockDiscoveredClue]}
        onDiscover={vi.fn()}
        onInspect={handleInspect}
        index={1}
      />
    );

    expect(screen.getByText('DISCOVERED')).toBeDefined();
    expect(screen.getByText('Secret Diary')).toBeDefined();
    expect(screen.getByText('A leather-bound diary with torn pages.')).toBeDefined();

    fireEvent.click(screen.getByText('Secret Diary'));
    expect(handleInspect).toHaveBeenCalledWith(mockDiscoveredClue);
  });
});
