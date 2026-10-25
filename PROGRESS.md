# Implementation Progress

## Status Overview
- Current Phase: Phase 1 - Shared
- Overall Completion: 1 / 8 Phases completed

---

### Phase 0: Scaffold
- **Status**: COMPLETED
- **Done**:
  - Initialized git repository, `.gitignore`, `ASSUMPTIONS.md`, `BLOCKERS.md`, `PROGRESS.md`.
  - Configured npm workspaces monorepo: `shared` (`@mystery/shared`), `server` (`@mystery/server`), `client` (`@mystery/client`).
  - Added root scripts: `dev`, `build:server`, `build:client`, `start:server`, `test`, `test:e2e`, `lint`, `typecheck`.
  - Configured TypeScript strict mode across workspaces with composite references.
  - Configured ESLint (`.eslintrc.cjs`), Prettier (`.prettierrc`), Vitest workspace (`vitest.workspace.ts`), Playwright config (`playwright.config.ts`), and CI workflow (`.github/workflows/ci.yml`).
  - Added `.env.example` at root, `server/.env.example`, `client/.env.example`, and `client/vercel.json`.
- **Test Results**:
  - `npm run typecheck`: Passed (code 0)
  - `npm run lint`: Passed (code 0)
  - `npm test`: 1 passed (code 0)
  - `npm run build:server`: Passed (code 0)
  - `npm run build:client`: Passed (code 0)
  - `npm run start:server`: Passed (code 0)

---

### Phase 1: Shared
- **Status**: IN PROGRESS
- **Done**:
- **Next**:
  - Implement shared Zod schemas and TypeScript types (`schemas/case.ts`, `schemas/api.ts`, etc.)
  - Difficulty tier matrix (SPEC 5.1) and constants
  - Error codes (SPEC 4.2)
  - Assets constants and Cloudinary helpers (SPEC 9.11)
  - Sample premises (SPEC 10.5)
  - Scoring pure function `calculateScore()` in `/shared` and unit tests covering all rows in SPEC 5.2
