import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressRing } from './ProgressRing';

describe('ProgressRing Component', () => {
  it('renders progress ratio and label', () => {
    render(<ProgressRing current={3} total={7} label="Clues" />);
    expect(screen.getByText('3/7')).toBeDefined();
    expect(screen.getByText('Clues')).toBeDefined();
  });

  it('renders hints used and score preview when provided', () => {
    render(
      <ProgressRing
        current={4}
        total={7}
        hintsUsed={1}
        scorePreview={170}
      />
    );
    expect(screen.getByText('4/7')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('170 pts')).toBeDefined();
  });
});
