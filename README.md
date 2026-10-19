# Parsons Puzzle SUTD / AlgoKnit

An interactive mathematical proof-learning application for SUTD 50.004 Algorithms. Students arrange shuffled proof blocks into a solution; educators create puzzles; Astra retrieves previously verified puzzles or generates new ones using OpenAI and a Lean 4 worker.

This README describes the current source checkout. The configured GitHub repository is [lav-22/AlgoKnit](https://github.com/lav-22/AlgoKnit). Local changes become available to other users only after they are committed and pushed.

## Features

### Student practice

- Drag proof blocks between the available-block panel and proof workspace, reorder them, and reset the puzzle.
- Receive automatic order-based feedback, scores, hints, and completion feedback against the stored solution order.
- Render mathematical notation with KaTeX and use interactive placeholders in puzzles that include them.
- Open the built-in dictionary and help panel for mathematical terminology.
- Select Easy, Medium, or Hard difficulty and multiple proof-topic filters.
- Choose **Local Database** for bundled JSON puzzles or **Astra (MongoDB + OpenAI)** for verified-puzzle retrieval and generation.

The current student topic controls offer Induction, Set Theory, Recursion, Logic, Combinatorics, Graph Theory, and Data Structures. The backend additionally accepts `big-o`; the bundled collection and educator form include Big O puzzles. Bundled content covers four categories: Big O, Induction, Recursion, and Set Theory. Local filters match puzzle tags, so some topic/difficulty combinations have no results.

### Astra generation and Lean verification

1. Look for an active, Lean-verified database puzzle matching the selected difficulty/topics that this user has not seen or attempted.
2. If none is available, request structured puzzle JSON from OpenAI, including student-facing proof blocks and a complete Lean theorem.
3. Check the puzzle contract: required fields, block IDs, solution order, difficulty, category, and proof-step content.
4. Send the Lean source to the local worker for compilation against Mathlib.
5. Retry formatting or verification failures with repair feedback, within the configured attempt limit.
6. Save successful puzzles, verification metadata, model/response details, and repair counters; then return the puzzle to the student.

Generated puzzles target 4–7 blocks for Easy, 7–10 for Medium, and 9–12 for Hard. Content fingerprints help deduplicate generated records. OpenAI requests support background polling and timeouts.

**Verification scope:** Lean checks the generated Lean theorem before publication through the generation flow. Student arrangements are checked against `solutionOrder` in the browser; each student arrangement is not separately compiled in Lean. The system does not formally establish that every natural-language block exactly expresses its Lean fragment. Educator-created and bundled puzzles are not automatically Lean-verified.

### Educator tools

- Create puzzles with a title, statement, difficulty, tags, and at least two ordered LaTeX proof blocks.
- Preview content and publish through the backend to MongoDB.
- Keep browser-local backups and download a category JSON fallback for certain network failures.
- View puzzle-count statistics and export available puzzle records.

Normal successful server publication requires no manual JSON replacement. The current success dialog still shows older file-download instructions; follow the [Educator guide](guides/EDUCATOR_GUIDE.md). Local backups do not synchronize automatically. Export currently requests up to 1,000 server puzzles, or uses browser-local records if fetching fails; it is not a complete database backup.

### Storage and reliability

- MongoDB stores puzzle content, generation/verification metadata, usage counts, and per-user seen/attempt/completion history.
- A stable anonymous ID is stored in browser local storage. History belongs to that browser identity; there is no account login or cross-device identity system.
- The backend reconnects to MongoDB automatically, with configurable timeouts and DNS fallback for certain Atlas lookup failures.
- The frontend polls backend health and can fall back to bundled content when the API is unavailable.
- REST endpoints support puzzle creation, retrieval, filtering, updates, soft deletion, and statistics.
- Security headers, configurable request limits, and CORS rules are implemented. Authentication and authorization are not implemented.

## Architecture

```text
React/Vite frontend
  ├── Bundled JSON puzzles → local practice
  └── Express API
        ├── MongoDB → puzzles and user history
        └── Astra generation service
              ├── OpenAI Responses API → candidate puzzle
              └── Lean worker → Lean 4 + Mathlib verification
```

| Component | Local default | Location |
| --- | --- | --- |
| Frontend | http://localhost:5173 | `src/` |
| Backend | http://localhost:5001/api | `server/` |
| Lean worker | http://127.0.0.1:3001 | `lean-worker/` |
| Database | Local MongoDB or Atlas URI | Configured in `server/.env` |

## Set up from GitHub

### 1. Prerequisites

- Git and Node.js with npm. Use Node **22.12 or newer** for this guide; the current machine uses 26.7.0. The project uses [JSON import attributes](https://nodejs.org/api/esm.html#import-attributes), so the old Node 16 instructions no longer apply.
- A running MongoDB instance or an Atlas cluster for server storage and Astra.
- [Elan, Lean's toolchain manager](https://lean-lang.org/install/manual/), with `elan` and `lake` available in your terminal for proof verification.
- An OpenAI API key and access to a model supporting the structured-output request used by this project, for generating new puzzles.
- Internet access for dependency installation, Mathlib cache downloads, Atlas if used, and OpenAI. Allow several GB of disk space for Lean/Mathlib dependencies.

The Lean worker pins **Lean 4.32.0 and Mathlib v4.32.0**. Use the checked-in toolchain and dependency files together.

### 2. Clone and install dependencies

```bash
git clone https://github.com/lav-22/AlgoKnit.git
cd AlgoKnit
npm ci
npm --prefix server ci
```

If using a fork, replace the clone URL with your fork's URL and enter the directory Git creates. Subsequent commands assume the repository root unless stated otherwise.

### 3. Configure the frontend

Create `.env` at the repository root with these values, or add them to your existing file:

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_API_TIMEOUT_MS=30000
VITE_GENERATION_TIMEOUT_MS=1200000
```

These settings are public browser configuration. Keep the OpenAI key and database credentials in `server/.env`, never in a `VITE_` variable. Restart Vite after changing frontend settings.

### 4. Configure the backend

For a fresh checkout, copy the backend template:

```bash
cp server/.env.example server/.env
```

PowerShell equivalent:

```powershell
Copy-Item server/.env.example server/.env
```

Skip the copy if `server/.env` already exists. Edit that file and replace placeholder values:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/parsonspuzzle
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

OPENAI_API_KEY=replace-with-your-api-key
OPENAI_MODEL=replace-with-an-accessible-model-id
OPENAI_ASSISTANT_NAME=Astra
OPENAI_SERVICE_TIER=auto
OPENAI_BACKGROUND=true
OPENAI_TIMEOUT_MS=300000
OPENAI_POLL_INTERVAL_MS=2000
OPENAI_REPAIR_ATTEMPTS=2

LEAN_VERIFY_URL=http://127.0.0.1:3001/verify
LEAN_TIMEOUT_MS=30000
```

`OPENAI_MODEL` overrides the model used by the service. The code/template currently default to `gpt-6-astra`; that string alone does not establish access for your API account. Configure a model available to your account. `OPENAI_ASSISTANT_NAME` is a display/prompt label, not an Assistants API resource ID.

For Atlas, replace `MONGODB_URI` with the connection string from your cluster, including your database name. Create a database user and allow your machine's IP through Atlas network access. URI-encode special characters in the password. For local MongoDB, start the database service separately before running the backend.

See [server/.env.example](server/.env.example) for optional rate-limit, database timeout, reconnect, and DNS settings. Environment files are excluded from Git.

### 5. Install the Lean toolchain and Mathlib cache

After installing Elan using the linked official instructions, open a terminal where `lake` is on PATH:

```bash
cd lean-worker
elan toolchain install leanprover/lean4:v4.32.0
npm run setup
lake env lean --version
cd ..
```

`npm run setup` runs `lake update` and `lake exe cache get`. It fetches dependency sources and compiled Mathlib artifacts; initial setup may take time. Review any change to `lake-manifest.json` before committing it. The worker uses Node's built-in modules and has no separate npm dependencies to install.

The generated `.lake/` directory is excluded from Git. Its `config/1` and `config/5` folders currently cache configurations for Mathlib and ProofWidgets respectively; both are used and managed by Lake.

### 6. Start the complete application

From the repository root:

```bash
npm run dev:fullstack
```

This starts the frontend, backend, and Lean worker. It does not start MongoDB. Alternatively, use separate terminals from the root:

```bash
npm run dev
npm run dev:server
npm run dev:lean
```

Open:

- Student mode: http://localhost:5173/student
- Educator mode: http://localhost:5173/educator
- Backend health: http://localhost:5001/api/health
- Worker health: http://127.0.0.1:3001/health

The backend health check returns HTTP 200 with `database: "connected"` when ready, or HTTP 503 while disconnected. The worker health check confirms compiler availability; the proof check below also exercises Mathlib.

### 7. Check the first-run workflow

1. Check both health endpoints.
2. On a fresh empty database, publish a simple puzzle through Educator mode first, then reload Student mode. The current student page can otherwise stop at “No puzzles available” when the API is healthy but returns no puzzles.
3. In Student mode, select **Astra (MongoDB + OpenAI)**, choose a difficulty/topic, and click **Generate Puzzle**. Generation requires the key, database, and worker; it can take several minutes.
4. Arrange blocks and check the automatic feedback. Request another puzzle to exercise history-aware retrieval/generation.

For a direct compiler check, run from `lean-worker` in a Bash-compatible terminal:

```bash
printf 'import Mathlib\nexample (n : Nat) : n + 0 = n := by simp\n' | lake env lean --stdin
```

A successful check exits without errors. In PowerShell, pipe the same source using:

```powershell
"import Mathlib`nexample (n : Nat) : n + 0 = n := by simp" | lake env lean --stdin
```

### Local-only practice

After installing the frontend dependencies, run `npm run dev` without the backend. Once the connection check falls back to bundled puzzles, choose **Local Database** and click **Generate Puzzle**. This selects a bundled puzzle; it does not call OpenAI. MongoDB, an API key, and Lean are not required for this mode. Broaden the filters if no local puzzle matches.

## Optional bundled-puzzle import

The repository includes `npm --prefix server run migrate`, which reads `src/puzzles/data/` and creates or updates MongoDB records by puzzle ID.

The importer uses the model’s category keys: `big-o`, `induction`, `set-theory`, and `recursion`. This command is not a required installation step. Existing matching records can be overwritten and reactivated, and per-puzzle errors may not produce a failing process exit code. Back up edited records before re-importing and inspect the results.

See [Database setup](guides/MIGRATION_GUIDE.md) for connection and import behavior.

## Commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the frontend |
| `npm run dev:server` | Start the backend with automatic restarts |
| `npm run dev:lean` | Start the Lean worker |
| `npm run dev:fullstack` | Start all three application processes |
| `npm test` | Run frontend and backend tests |
| `npm run test:frontend` | Run frontend tests |
| `npm run test:server` | Run backend tests |
| `npm run lint` | Check JavaScript/React code |
| `npm run build` | Generate the production frontend in `dist/` |
| `npm run preview` | Preview the built frontend; backend services remain separate |

Automated tests include contract validation, Lean-client response handling, OpenAI background polling, and generation repair counters. Mock-based tests do not establish live OpenAI, MongoDB, or Lean availability; use the first-run checks above.

## Repository map

```text
src/
  components/       Student, educator, navigation, and shared UI
  pages/            Student and educator screens
  hooks/            Application state, puzzle loading, and API health
  services/         Browser API clients, puzzle loading, and user identity
  puzzles/data/     Bundled JSON puzzles
  data/             Dictionary terms
  utils/            Student proof-order validation
server/
  server.js         Express startup and health endpoint
  models/           Puzzle and user-history database schemas
  routes/           Puzzle management and generation endpoints
  services/         Database, OpenAI, contract, prompt, and Lean integration
  scripts/          Bundled-puzzle importer
  test/             Backend automated tests
lean-worker/
  server.js         Local HTTP service that invokes Lean
  lean-toolchain    Pinned Lean version
  lakefile.toml     Mathlib dependency declaration
  lake-manifest.json  Resolved dependency revisions
  .lake/            Generated dependencies and caches; ignored by Git
public/             Static assets copied unchanged into the frontend build
dist/               Generated frontend build; ignored by Git
guides/             Current development, educator, and database guides
  archive/          Historical migration documentation
```

Some older frontend generation and Lean-service files remain for legacy code/tests. The active Student Astra flow calls the backend's `/api/generate`; proof verification happens through `server/services/leanClient.js` and the separate worker.

## API overview

| Method and path | Purpose |
| --- | --- |
| `GET /api/health` | Backend/database health |
| `GET /api/puzzles` | Filtered, paginated active puzzles |
| `GET /api/puzzles/:id` | One active puzzle |
| `GET /api/puzzles/category/:category` | Puzzles in a category |
| `GET /api/puzzles/stats/summary` | Puzzle counts |
| `POST /api/puzzles` | Create a puzzle |
| `PUT /api/puzzles/:id` | Update a puzzle |
| `DELETE /api/puzzles/:id` | Mark a puzzle inactive |
| `POST /api/generate` | Retrieve an unseen verified puzzle or generate one |
| `POST /api/generate/:puzzleId/tried` | Record an attempt or completion |

Generation requests contain `userId`, `requestId`, `difficulty`, and a `topics` array. Accepted category keys are `big-o`, `induction`, `set-theory`, `recursion`, `logic`, `combinatorics`, `graph-theory`, and `data-structures`.

The worker exposes `GET /health`, `POST /verify`, and `POST /syntax-check`. Both POST routes currently compile the submitted Lean source. Keep the worker internal; its default listener is `127.0.0.1:3001`.

## Build and deployment

For a production frontend, set `VITE_API_BASE_URL` to the deployed backend's `/api` address **before** running `npm run build`. Deploy `dist/` with an SPA fallback to `index.html`. The backend runs separately with `npm --prefix server start`, its own environment variables, and `FRONTEND_URL` set to the deployed frontend origin. GitHub Pages can host static output but cannot run the backend, database, or Lean worker.

The existing `docker-compose.yml` starts a frontend at http://localhost:3000, a backend at http://localhost:5000/api, and MongoDB:

```bash
docker compose up --build
```

Stop them with `docker compose down`. The supplied Compose setup does **not** configure OpenAI or include a Lean worker, so it is not a complete Astra deployment. Its frontend API URL is also set to localhost; change that build setting for remote users. Use the local full-stack instructions for the complete current development flow.

Before exposing the application publicly, add authentication/authorization for puzzle writes and generation. Deploy the Lean worker with a separate execution sandbox and resource/network restrictions; its local process boundary is not a production sandbox. See the [worker README](lean-worker/README.md).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `lake` is not found | Install Elan and reopen a terminal with its bin directory on PATH |
| Lean or Mathlib import fails | Run setup inside `lean-worker`; keep toolchain and Mathlib pins aligned |
| Backend health returns 503 | Check MongoDB service/Atlas access, credentials, DNS, and backend logs |
| OpenAI access/model error | Set the key and an accessible model in `server/.env`; restart the backend |
| Generation timeout | Check worker health and server logs; review OpenAI, Lean, and frontend generation timeouts separately |
| Frontend cannot reach API | Check `VITE_API_BASE_URL`, port 5001, and restart Vite after environment changes |
| No puzzles on a fresh database | Publish one through Educator mode and reload Student mode; see the first-run limitation above |
| No local puzzle matches | Clear topic filters or choose another difficulty |
| Published puzzle is missing | Reload Student mode and check the data source; a browser-local fallback is not a server save |
| Port already in use | Stop the existing process or change the port and its corresponding client URL |

## Further documentation

- [Development and bundled JSON reference](guides/DEVELOPMENT.md)
- [Educator guide](guides/EDUCATOR_GUIDE.md)
- [Database setup and import](guides/MIGRATION_GUIDE.md)
- [Lean worker](lean-worker/README.md)
- [Historical JavaScript-to-JSON migration](guides/archive/JSON_MIGRATION_GUIDE.md)

When contributing, create a branch, run the relevant tests/lint/build checks, and update documentation with behavior changes. Keep credentials and generated folders (`node_modules/`, `dist/`, and `lean-worker/.lake/`) out of commits. Preserve the npm lockfiles and Lean dependency pins.
