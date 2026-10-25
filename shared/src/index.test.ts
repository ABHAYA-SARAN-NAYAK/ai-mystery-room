import { describe, it, expect } from 'vitest';
import { VERSION } from './index';

describe('Shared Package Scaffold', () => {
  it('exports VERSION 1.0.0', () => {
    expect(VERSION).toBe('1.0.0');
  });
});
