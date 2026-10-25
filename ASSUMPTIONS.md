# Assumptions & Design Decisions

This document logs all key design choices, dependencies, and assumptions made during implementation following SPEC.md Section 10 > Section 9 > Sections 1-8.

## Tooling & Architecture
1. **Monorepo setup**: npm workspaces with packages `@mystery/shared`, `@mystery/server`, and `@mystery/client`.
2. **Bundling**: `tsup` bundles `@mystery/server` into `server/dist/index.js`, inlining `@mystery/shared` code to ensure `npm run start:server` runs without runtime module resolution issues on host environments.
3. **Database in Tests**: `mongodb-memory-server` is used for Supertest integration and concurrency tests, with isolated databases per test suite.
4. **Fixture Mocking**: `GEMINI_MOCK=true` serves deterministic recorded fixtures (3 Easy, 3 Medium, 3 Hard) matching user premise/difficulty or falling back to a fixture matching the requested difficulty.
5. **Score wrong keeps clue bonus**: Per SPEC 5.2 decision flag, `SCORE_WRONG_KEEPS_CLUE_BONUS=true` defaults to true so players still get clue bonuses when wrong, subject to max(0, rawTotal).
6. **Rate limiting in test environment**: Disabled or high limits when `NODE_ENV=test` to prevent flaky integration test runs.
7. **Dependencies**:
   - `tsup`: Used in `@mystery/server` and `@mystery/shared` for fast, zero-config TypeScript bundling.
   - `nanoid`: For cryptographically secure, collision-resistant 16-character public IDs.
   - `lucide-react`: Lightweight icon library matching modern clean SVG noir icons.
