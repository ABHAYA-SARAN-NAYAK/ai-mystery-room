# Implementation Progress

## Status Overview
- Current Phase: Phase 6 - Pages
- Overall Completion: 6 / 8 Phases completed

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
- **Status**: COMPLETED
- **Done**:
  - Implemented premise safety sanitizer (`ai/safety.ts`) rejecting prompt injections, URLs, and unsafe content per SPEC 5.6.
  - Implemented prompt builders (`ai/prompts/system.ts` and `ai/prompts/user.ts`) with fair-play rules, exact tier counts, and retry feedback.
  - Implemented official `@google/genai` integration with structured JSON generation and 35s per-attempt timeout (`ai/generator.ts`).
  - Added fixture collection: 9 valid fixtures (3 Easy, 3 Medium, 3 Hard) and 12 invalid fixtures testing every rule from SPEC 5.7 and 10.2.
  - Built 15-step backend validation pipeline (`ai/validator.ts`) covering counts, IDs, culprit consistency, deduction chains, unlock graphs, leak lints, and hint safety.
  - Implemented solver pass (`ai/solver.ts`) calling Gemini with sanitized evidence to verify single solvency.
  - Implemented background generation worker (`services/generationService.ts`) with daily quota guard (`MAX_DAILY_GENERATIONS`).
  - Implemented automated sweep job (`services/sweepService.ts`) running on startup and every 10 minutes to clean stale generation cases and abandon inactive cases.
- **Test Results**:
  - `npm run typecheck`: Passed (code 0)
  - `npm run lint`: Passed (code 0, 0 warnings)
  - `npm test`: 50 passed across 9 test files (code 0)
  - `npm run build:server`: Passed (code 0)

---

### Phase 4: API
- **Status**: COMPLETED
- **Done**:
  - Implemented all required API endpoints (`server/src/controllers/caseController.ts` and `server/src/routes/caseRoutes.ts`):
    - `POST /api/cases` (generates case, returns 202 with sessionToken)
    - `GET /api/cases/:id` (polling while generating, sanitized active/accused state)
    - `POST /api/cases/:id/clues/:clueId/discover` (atomic discovery via `$addToSet`, enforces `requires` unlock chains, idempotent)
    - `POST /api/cases/:id/hints` (atomic hint usage with points penalty, enforces `unlockAtClues`)
    - `POST /api/cases/:id/accuse` (atomic accusation transition with single-winner race guard, locks until `minCluesToAccuse` found)
    - `GET /api/cases/:id/result` (returns 409 prior to accusation, full culprit reveal and deduction chain afterwards)
    - `POST /api/cases/:id/cancel` (abandons in-progress generation or active case)
  - Built comprehensive Supertest integration test suite (`caseRoutes.test.ts`) covering success, validation, auth, and state errors.
  - Added automated deep secrecy leak test (`leak.test.ts`) verifying no culprit fields, forbidden keys, or secret texts leak across public endpoints.
  - Added concurrency test (`concurrency.test.ts`) proving that 10 parallel accusation calls result in exactly 1 success and 9 rejections with `409 ALREADY_ACCUSED`.
- **Test Results**:
  - `npm run typecheck`: Passed (code 0)
  - `npm run lint`: Passed (code 0, 0 warnings)
  - `npm test`: 70 passed across 12 test files (code 0)
  - `npm run build:server`: Passed (code 0)

---

### Phase 5: Client foundation
- **Status**: COMPLETED
- **Done**:
  - Configured Tailwind CSS with custom noir color palette, typography (`Bebas Neue`, `Inter`, `Caveat`, `Special Elite`), paper textures, and suspect ring colors (SPEC 9.2, 9.9).
  - Configured global styles with dark overlay (`.page-bg`), rubber stamps (`.rubber-stamp`), and reduced motion overrides (`styles/index.css`).
  - Built `PageBackground` component with dynamic image preloading (SPEC 9.6).
  - Built responsive `Navbar` with logo mark, navigation links with active indicators, CTA buttons, and mobile drawer (SPEC 9.5).
  - Built `GlobalErrorBanner` with ARIA-live alerts and retry action.
  - Built `ApiClient` with automated `X-Session-Token` injection and normalized error handling (`lib/api.ts`).
  - Built Zustand `useSessionStore` with `localStorage` persistence for active session and case history (`store/sessionStore.ts`).
  - Configured React Router v6 with all application routes (`router.tsx`).
- **Test Results**:
  - `npm run typecheck`: Passed (code 0)
  - `npm run lint`: Passed (code 0, 0 warnings)
  - `npm test`: 74 passed across 14 test files (code 0)
  - `npm run build:client`: Passed (code 0)

---

### Phase 6: Pages
- **Status**: IN PROGRESS
- **Done**:
- **Next**:
  - Home page (`HomePage.tsx`): Hero section, 4-item feature strip, 3 sample case cards (SPEC 10.5 #1, #5, #2), 3-step How It Works, Resume Case button
  - Create page (`CreatePage.tsx`): Spiral parchment form, 10-300 char counter, 6 sample premise chips & cards, difficulty selector cards, pinned case settings panel
  - Generating page (`GeneratingView.tsx`): 5-step vertical stepper, timer, scene polaroid, cancel button
  - Investigation Room (`InvestigationRoomPage.tsx`):
    - Case Header (title, date, difficulty, victim)
    - Tab bar (Briefing, Clues, Suspects, Progress, disabled Map & Notes with "Soon" tag)
    - 3-column desktop layout (Suspects / Clues & Briefing / Progress & Hints)
    - Clue card states (locked with requires check, discovering spinner, discovered with photo)
    - Clue detail panel (taped photo, description, "What this could mean?" insight)
    - Suspect cards & Suspect profile view (polaroid frame, Caveat quote, tabs, alibi timeline, related discovered clues)
    - Suspect avatars: ring color, number badge, alternate flip (`scaleX(-1)`)
    - Hint drawer (pre-generated hints, hidden text until redeemed, unlock thresholds)
    - Progress ring & live score preview
    - Accuse button with server-provided lock status (`cluesNeededToAccuse`)
  - Accusation modal (`AccuseModal.tsx`): suspect selector, reasoning input, two-step review & confirm, irreversible warning
  - Results page (`ResultsPage.tsx`): Verdict banner, rubber stamp animation, score breakdown table, culprit reveal card, deduction steps, true timeline, play again CTA
  - Static pages: `MyCasesPage.tsx`, `HowItWorksPage.tsx`, `AboutPage.tsx`, `NotFoundPage.tsx`
