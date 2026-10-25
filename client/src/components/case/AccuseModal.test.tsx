import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccuseModal } from './AccuseModal';
import { PublicSuspect } from '@mystery/shared';

describe('AccuseModal Component', () => {
  const mockSuspects: PublicSuspect[] = [
    {
      id: 's1',
      name: 'Arthur Pendelton',
      age: 48,
      occupation: 'Butler',
      relationshipToVictim: 'Employee',
      publicStatement: 'I was in the pantry preparing tea.',
      gender: 'male',
      background: 'Loyal servant for 20 years.',
      personality: 'Reserved and formal.',
      alibiTimeline: [
        { time: '9:00 PM', label: 'In the kitchen' },
        { time: '9:30 PM', label: 'Serving tea' },
        { time: '10:00 PM', label: 'Cleaning up' },
      ],
      connections: [],
    },
    {
      id: 's2',
      name: 'Clara Oswald',
      age: 26,
      occupation: 'Botanist',
      relationshipToVictim: 'Niece',
      publicStatement: 'I was reading in the conservatory.',
      gender: 'female',
      background: 'Studying rare flora.',
      personality: 'Quiet and observant.',
      alibiTimeline: [
        { time: '9:00 PM', label: 'Conservatory' },
        { time: '9:30 PM', label: 'Reading' },
        { time: '10:00 PM', label: 'Walked to bedroom' },
      ],
      connections: [],
    },
  ];

  it('allows picking a suspect and proceeding to review step', () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <AccuseModal
        isOpen={true}
        onClose={vi.fn()}
        suspects={mockSuspects}
        onConfirmAccusation={handleConfirm}
      />
    );

    expect(screen.getByText('Arthur Pendelton')).toBeDefined();
    expect(screen.getByText('Clara Oswald')).toBeDefined();

    // Select Clara
    fireEvent.click(screen.getByText('Clara Oswald'));

    // Click Review Accusation
    const reviewBtn = screen.getByText('Review Accusation');
    fireEvent.click(reviewBtn);

    // In Review step
    expect(screen.getByText('Primary Accused')).toBeDefined();
    expect(screen.getByText('Confirm Accusation')).toBeDefined();

    // Confirm
    fireEvent.click(screen.getByText('Confirm Accusation'));
    expect(handleConfirm).toHaveBeenCalledWith('s2', '');
  });
});
