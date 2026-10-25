# Implementation Progress

## Status Overview
- Current Phase: Phase 2 - Server core
- Overall Completion: 2 / 8 Phases completed

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
- **Status**: IN PROGRESS
- **Done**:
- **Next**:
  - Mongoose models (`MysteryCase`, `PlayerSession`, `AuditLog`) with schema definitions from 4.4 and additions from 10.1
  - TTL indexes (failed cases expire after 7 days, audit logs expire after 30 days)
  - Allow-list serializers in `server/src/serializers/` (strictly no culprit data leaks)
  - Session token SHA-256 hashing utility
  - Middleware: requestId, error handler, CORS, rate limits per endpoint (4.1), validation, auth by `X-Session-Token`
  - Health endpoint `GET /healthz` returning `{ ok: true, db: "up" | "down" }`
  - Graceful shutdown on SIGTERM
