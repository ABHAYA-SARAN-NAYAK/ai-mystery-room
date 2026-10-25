# Implementation Progress

## Status Overview
- Current Phase: Phase 3 - AI pipeline
- Overall Completion: 3 / 8 Phases completed

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
- **Status**: COMPLETED
- **Done**:
  - Defined Zod schemas and TypeScript models for Suspects, Clues, Hints, Victims, DeductionSteps, TimelineItems, and GeneratedMystery (`schemas/case.ts`).
  - Defined API request/response schemas for all lifecycle actions (`schemas/api.ts`).
  - Implemented difficulty tier matrix according to SPEC 5.1 & 10.2 (`constants/difficulty.ts`).
  - Implemented error codes according to SPEC 4.2 (`constants/errors.ts`).
  - Implemented Cloudinary asset maps and helper functions according to SPEC 9.11 (`constants/assets.ts`).
  - Implemented 6 fixed sample premises with scene mappings according to SPEC 10.5 (`constants/samples.ts`).
  - Implemented pure scoring function `calculateScore()` in `/shared` according to SPEC 5.2.
  - Added comprehensive unit tests covering all example rows in Section 5.2 and edge cases (`calculateScore.test.ts`, `index.test.ts`).
- **Test Results**:
  - `npm run typecheck`: Passed (code 0)
  - `npm run lint`: Passed (code 0)
  - `npm test`: 12 passed across 2 test files (code 0)
  - `npm run build:server`: Passed (code 0)
  - `npm run build:client`: Passed (code 0)

---

### Phase 2: Server core
- **Status**: COMPLETED
- **Done**:
  - Implemented Mongoose models with TTL indexes:
    - `MysteryCase` (with `secret` configured with `{ select: false }`, TTL for failed cases after 7 days)
    - `PlayerSession` (hashes session token with SHA-256)
    - `AuditLog` (TTL index for 30 days, no secret data logged)
  - Implemented strict allow-list serializers in `server/src/serializers/case.ts`:
    - Prevents culprit and secret leaks in any public payload
    - Ensures locked clues never expose descriptions, visualKeys, insights, or roles
    - Hides hint text until the hint has been redeemed
  - Built Express app with security headers (`helmet`, `hpp`), CORS whitelist, request ID propagation, body limit of 10 KB, `trust proxy: 1`, and `x-powered-by` disabled.
  - Implemented rate limiters for case creation, clue discovery, hint redemption, accusations, and general routes.
  - Implemented authentication middleware (`requireSessionAuth`) validating `X-Session-Token` against stored SHA-256 hashes.
  - Implemented health check routes (`GET /healthz` and `GET /api/healthz`) reporting DB connection status.
- **Test Results**:
  - `npm run typecheck`: Passed (code 0)
  - `npm run lint`: Passed (code 0, 0 warnings)
  - `npm test`: 24 passed across 5 test files (code 0)
  - `npm run build:server`: Passed (code 0)

---

### Phase 3: AI pipeline
- **Status**: IN PROGRESS
- **Done**:
- **Next**:
  - Premise safety sanitizer (SPEC 5.6)
  - System and user prompt builder (SPEC 5.5)
  - Gemini SDK client integration with JSON schema enforcement (`@google/genai`)
  - Fixtures for `GEMINI_MOCK=true`: 3 valid fixtures per difficulty (3 Easy, 3 Medium, 3 Hard = 9 total) and at least 10 invalid fixtures breaking different validation rules
  - 15-step backend validation pipeline (SPEC 5.7 plus unlock-chain checks in 10.2)
  - Solver pass (`ENABLE_SOLVER_PASS`)
  - Generation worker with retries (up to 3 attempts), stage progression (scene -> suspects -> clues -> hiding -> validating), and background job
  - Stale generation sweep job (on startup and every 10 min)
