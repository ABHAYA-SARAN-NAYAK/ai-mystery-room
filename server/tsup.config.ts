import fs from 'fs';
import path from 'path';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  noExternal: ['@mystery/shared'],
  splitting: false,
  onSuccess: async () => {
    const srcFixtures = path.resolve('src/ai/fixtures');
    const distFixtures = path.resolve('dist/fixtures');
    if (fs.existsSync(srcFixtures)) {
      fs.cpSync(srcFixtures, distFixtures, { recursive: true });
    }
  },
});
