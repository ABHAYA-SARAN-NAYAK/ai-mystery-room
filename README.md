# AI Mystery Room 🔍🎩

> A zero-leak, fair-play generative detective mystery game where every case is procedurally generated with solvable evidence chains, airtight alibis, and verifiable clues.

---

## 📑 Table of Contents
1. [Overview & Core Mechanics](#-overview--core-mechanics)
2. [Secrecy Architecture & Fair Play](#-secrecy-architecture--fair-play)
3. [Monorepo Structure](#-monorepo-structure)
4. [Environment Variables](#-environment-variables)
5. [Getting Started & Local Development](#-getting-started--local-development)
   - [Option A: Mock Mode (No API Key Required)](#option-a-mock-mode-no-api-key-or-cloud-quota-required)
   - [Option B: Real Gemini AI Mode](#option-b-real-gemini-ai-mode)
6. [Testing & Verification](#-testing--verification)
7. [Deployment Guide](#-deployment-guide)
   - [Deploying Server to Render](#deploying-server-to-render)
   - [Deploying Client to Vercel](#deploying-client-to-vercel)
8. [API Reference](#-api-reference)

---

## 🔍 Overview & Core Mechanics

AI Mystery Room is a full-stack procedural mystery game where players investigate crime scenes, unlock interconnected evidence, examine suspect statements and alibi timelines, redeem strategic detective hints, and indict the real culprit.

### Key Rules & Features
- **Fair-Play Generative Mysteries**: Every case contains a mathematically verified deduction chain. There is always exactly one culprit whose motive, means, and opportunity are proven by evidence, while all innocent suspects have airtight alibis.
- **Dynamic Evidence Lock Graph**: Deeper evidence items require discovering prerequisite clues first (`requires: ["c1"]`).
- **Hint Economy**: Hints cost -10 points each and remain locked behind progressive clue discovery thresholds (`unlockAtClues`).
- **Unified Scoring**: Pure `calculateScore()` scoring engine computes performance based on difficulty base, clues discovered, hints used, and accusation accuracy.
- **Atomic Operations**: All clue discoveries, hint redemptions, and accusations use atomic MongoDB updates (`$addToSet`, atomic conditional `findOneAndUpdate`) with race condition protection.

---

## 🔒 Secrecy Architecture & Fair Play

To prevent any player from cheating using browser DevTools or intercepted network packets:
1. **Zero-Leak API Serializers**: Prior to formal accusation, no API payload ever contains culprit identifiers, motive, method, confession, deduction step details, or clue roles.
2. **Hidden Locked Content**: Clues that have not yet been discovered return strictly sanitized placeholders; their descriptions, visual keys, and analytical insights are withheld until discovered.
3. **Mongoose `select: false`**: The `secret` field containing the true crime confession and deduction chain is excluded by default in database queries.
4. **Automated Leak Tests**: The test suite includes an automated deep-inspection test (`server/src/routes/leak.test.ts`) that asserts zero leakage of secret keys across all public endpoints.

---

## 🏗 Monorepo Structure

```
├── client/                 # React 18 SPA (Vite, Tailwind CSS, Zustand, React Router)
│   ├── src/
│   │   ├── components/     # Clue cards, hint drawer, accusation modal, avatars, progress ring
│   │   ├── pages/          # Home, Create, Investigation Room, Clues, Suspects, Results, My Cases
│   │   ├── store/          # Zustand session & local storage history store
│   │   └── lib/            # Authenticated API client
│   └── vercel.json         # SPA routing rewrites for Vercel
├── server/                 # Node.js 20 Express backend
│   ├── src/
│   │   ├── ai/             # Gemini SDK client, prompts, safety sanitizer, validator, mock fixtures
│   │   ├── controllers/    # Case lifecycle route handlers
│   │   ├── middleware/     # Auth, validation, rate limiting, request ID, error handling
│   │   ├── models/         # Mongoose models (MysteryCase, PlayerSession, AuditLog)
│   │   ├── serializers/    # Zero-leak allow-list public response serializers
│   │   └── services/       # Async generation queue worker & sweep service
│   └── tsup.config.ts      # Self-contained bundle builder
├── shared/                 # Shared TypeScript types, Zod schemas, constants, scoring logic
│   ├── src/
│   │   ├── constants/      # Assets, difficulty tiers, sample premises, error codes
│   │   ├── schemas/        # Zod models for cases, suspects, clues, hints, API contracts
│   │   └── scoring/        # calculateScore() pure function and unit tests
├── e2e/                    # Playwright End-to-End test suites (Desktop & Mobile viewports)
├── scripts/                # E2E test runners with in-memory MongoDB
├── openapi.json            # OpenAPI 3.0 REST API specification
├── SPEC.md                 # Product specifications and non-negotiable rules
├── PROGRESS.md             # Phase-by-phase implementation log and test outputs
└── ASSUMPTIONS.md          # Architectural decisions and dependency notes
```

---

## ⚙️ Environment Variables

### Root / Global
| Variable | Description | Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment (`development`, `test`, `production`) | `development` |

### Server (`server/.env`)
| Variable | Required | Description | Default |
| :--- | :---: | :--- | :--- |
| `PORT` | No | HTTP listening port | `8080` |
| `MONGODB_URI` | Yes | MongoDB connection string (local or Atlas) | `mongodb://localhost:27017/ai-mystery-room` |
| `CLIENT_ORIGIN` | Yes | Allowed CORS origin(s), comma-separated | `http://localhost:5173` |
| `GEMINI_API_KEY` | Optional in mock | Google Gemini API Key from Google AI Studio | `""` |
| `GEMINI_MODEL` | No | Gemini model name | `gemini-2.5-flash` |
| `GEMINI_MOCK` | No | Serve deterministic offline test fixtures when `true` | `false` |
| `ENABLE_SOLVER_PASS` | No | Validate single-culprit solvency with second AI pass | `true` |
| `MAX_DAILY_GENERATIONS` | No | Maximum mystery generations per 24 hours | `50` |
| `RATE_LIMIT_CREATE_PER_HOUR` | No | Max case generations per IP per hour | `5` |
| `SCORE_WRONG_KEEPS_CLUE_BONUS` | No | Preserve discovered clues bonus on incorrect accusation | `true` |

### Client (`client/.env`)
| Variable | Required | Description | Default |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | No | API backend URL prefix | `/api` |

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x+
- **MongoDB**: Local MongoDB daemon or free MongoDB Atlas cluster (not needed for `npm test` or `npm run test:e2e`).

```bash
# Clone the repository
git clone <repo-url>
cd "AI Mystery Room"

# Install all workspace dependencies
npm ci
```

---

### Option A: Mock Mode (No API Key or Cloud Quota Required)
In mock mode, the backend uses recorded, validated fixtures for Easy, Medium, and Hard mysteries. No Gemini API key or quota is needed.

1. **Configure Server Environment**:
   Create `server/.env`:
   ```ini
   PORT=8080
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ai-mystery-room
   CLIENT_ORIGIN=http://localhost:5173
   GEMINI_MOCK=true
   ENABLE_SOLVER_PASS=false
   ```

2. **Start the Development Servers**:
   ```bash
   # Terminal 1: Build shared package and start backend
   npm run build --workspace=@mystery/shared
   npm run dev --workspace=@mystery/server

   # Terminal 2: Start frontend Vite dev server
   npm run dev --workspace=@mystery/client
   ```
   Open your browser at `http://localhost:5173`.

---

### Option B: Real Gemini AI Mode
To generate fresh, novel mysteries using Google's Gemini LLM:

1. **Obtain an API Key**:
   Get an API key from [Google AI Studio](https://aistudio.google.com/).

2. **Configure Server Environment**:
   In `server/.env`:
   ```ini
   PORT=8080
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ai-mystery-room
   CLIENT_ORIGIN=http://localhost:5173
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_MOCK=false
   ENABLE_SOLVER_PASS=true
   MAX_DAILY_GENERATIONS=50
   ```

3. **Start the Application**:
   ```bash
   # Terminal 1
   npm run build --workspace=@mystery/shared
   npm run dev --workspace=@mystery/server

   # Terminal 2
   npm run dev --workspace=@mystery/client
   ```

---

## 🧪 Testing & Verification

The codebase includes full test coverage across unit tests, schema validations, zero-leak checks, race condition tests, component tests, and end-to-end browser walkthroughs.

```bash
# 1. Typecheck all workspaces in strict mode
npm run typecheck

# 2. Lint all packages with ESLint
npm run lint

# 3. Run all unit, integration, and security leak tests (83 tests across 18 suites)
npm test

# 4. Run Playwright End-to-End tests (Desktop Chromium + Mobile Chrome)
npm run test:e2e
```

---

## 🚢 Deployment Guide

### Deploying Server to Render

1. **Create Web Service on Render**:
   - Environment: `Node`
   - Build Command: `npm ci && npm run build:server`
   - Start Command: `npm run start:server`
   - Health Check Path: `/healthz`

2. **Set Environment Variables on Render**:
   - `NODE_ENV`: `production`
   - `PORT`: `8080` (or leave default assigned by Render)
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/ai-mystery-room`
   - `CLIENT_ORIGIN`: `https://your-mystery-client.vercel.app`
   - `GEMINI_API_KEY`: `<your_gemini_api_key>`
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `GEMINI_MOCK`: `false`
   - `ENABLE_SOLVER_PASS`: `true`

---

### Deploying Client to Vercel

1. **Import Client Project to Vercel**:
   - Root Directory: `client`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Set Environment Variables on Vercel**:
   - `VITE_API_BASE_URL`: `https://your-server-service.onrender.com/api`

3. **SPA Rewrites**:
   The included `client/vercel.json` automatically redirects all route paths to `index.html` for clean client-side routing:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

---

## 📖 API Reference

An OpenAPI 3.0 specification is available at [`openapi.json`](file:///c:/Users/LENOVO/Desktop/AI%20Mystery%20Room/openapi.json).

### Core Endpoints
- `POST /api/cases` — Generate a new case (returns `202 Accepted` with `caseId` and `sessionToken`).
- `GET /api/cases/:id` — Poll generation progress or retrieve sanitized case board state.
- `POST /api/cases/:id/clues/:clueId/discover` — Investigate and unlock clue evidence.
- `POST /api/cases/:id/hints` — Redeem the next hint with a 10 pt score penalty.
- `POST /api/cases/:id/accuse` — Submit formal indictment with reasoning.
- `GET /api/cases/:id/result` — Reveal culprit, score breakdown, and true crime confession.
- `POST /api/cases/:id/cancel` — Cancel active generation or abandon mystery.
- `GET /healthz` — Server & database health probe (`{ ok: true, db: "up" }`).
