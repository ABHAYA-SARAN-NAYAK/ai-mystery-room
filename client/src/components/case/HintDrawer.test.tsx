import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HintDrawer } from './HintDrawer';
import { PublicHint } from '@mystery/shared';

describe('HintDrawer Component', () => {
  const mockHints: PublicHint[] = [
    {
      level: 1,
      unlockAtClues: 1,
      locked: false,
      used: true,
      text: 'Examine the footprints leading to the terrace.',
    },
    {
      level: 2,
      unlockAtClues: 3,
      locked: false,
      used: false,
    },
    {
      level: 3,
      unlockAtClues: 5,
      locked: true,
      used: false,
    },
  ];

  it('renders used hints with full text and penalty indicator', () => {
    render(
      <HintDrawer
        isOpen={true}
        onClose={vi.fn()}
        hints={mockHints}
        cluesDiscoveredCount={3}
        onUseHint={vi.fn()}
      />
    );

    expect(screen.getByText('Examine the footprints leading to the terrace.')).toBeDefined();
    expect(screen.getByText('Hint #1 (Used)')).toBeDefined();
    expect(screen.getAllByText('-10 pts').length).toBeGreaterThan(0);
  });

  it('renders available hint with use button and confirmation', () => {
    const handleUseHint = vi.fn().mockResolvedValue(undefined);

    render(
      <HintDrawer
        isOpen={true}
        onClose={vi.fn()}
        hints={mockHints}
        cluesDiscoveredCount={3}
        onUseHint={handleUseHint}
      />
    );

    expect(screen.getByText('Hint #2 (Available)')).toBeDefined();
    const useBtn = screen.getByText('Use Hint (-10 pts)');
    fireEvent.click(useBtn);

    // Confirmation appears
    expect(screen.getByText('Spend 10 points to reveal this hint now?')).toBeDefined();
    const confirmBtn = screen.getByText('Confirm (-10)');
    fireEvent.click(confirmBtn);

    expect(handleUseHint).toHaveBeenCalled();
  });

  it('renders locked hint with unlock threshold', () => {
    render(
      <HintDrawer
        isOpen={true}
        onClose={vi.fn()}
        hints={mockHints}
        cluesDiscoveredCount={3}
        onUseHint={vi.fn()}
      />
    );

    expect(screen.getByText('Hint #3 (Locked)')).toBeDefined();
    expect(screen.getByText(/Find 2 more clues to unlock this hint/)).toBeDefined();
  });
});
