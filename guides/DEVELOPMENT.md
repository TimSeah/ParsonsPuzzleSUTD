# Development guide

Checked against the local project on 18 September 2026.

## Local services

| Service | Default address | Purpose |
| --- | --- | --- |
| React/Vite frontend | http://localhost:5173 | Student and educator interfaces |
| Express backend | http://localhost:5001/api | Puzzle storage and generation API |
| Lean worker | http://127.0.0.1:3001 | Checks generated Lean proofs against Mathlib |
| MongoDB | Local MongoDB or Atlas | Persists puzzles |

The frontend includes bundled JSON puzzles for local use and fallback. Publishing to the server requires MongoDB. AI generation also requires a server-side OpenAI key and the Lean worker.

## First-time setup

Install Node.js/npm and Git, plus Elan with `lake` on your PATH for Lean verification. Use a Node version supporting JSON import attributes (`with { type: 'json' }`); this checkout was inspected with Node 26.7.0. The worker's `lean-toolchain` and `lakefile.toml` pin Lean and Mathlib to 4.32.0.

From the repository root:

```bash
npm install
npm --prefix server install
```

Create `.env` from [.env.example](../.env.example) and `server/.env` from [server/.env.example](../server/.env.example) if they do not already exist. Preserve existing settings. Configure:

- Root `.env`: `VITE_API_BASE_URL=http://localhost:5001/api`.
- `server/.env`: `MONGODB_URI`, `PORT=5001`, `FRONTEND_URL=http://localhost:5173`, and `NODE_ENV=development`.
- For generation, set `OPENAI_API_KEY` only in `server/.env`, select an accessible model using `OPENAI_MODEL`, and set `LEAN_VERIFY_URL=http://localhost:3001/verify`.

Never put secrets in variables prefixed with `VITE_`; those are exposed to the browser. The example files list optional timeout and reconnect settings.

Prepare the Mathlib cache:

```bash
cd lean-worker
npm run setup
cd ..
```

This runs `lake update` and downloads cached build artifacts. Review any resulting changes to `lake-manifest.json`. See the [worker README](../lean-worker/README.md) for worker details and deployment limits.

For database configuration and importing bundled puzzles, see [Database setup](MIGRATION_GUIDE.md).

## Start the app

From the repository root:

```bash
npm run dev:fullstack
```

This starts the frontend, backend, and Lean worker. MongoDB must be running separately or reachable through Atlas.

Alternatively, run each command in a separate terminal from the repository root:

```bash
npm run dev
npm run dev:server
npm run dev:lean
```

For bundled local puzzles alone, start the frontend and use the local data option. Server publishing and AI generation require the relevant services above.

## Check the services

- Open http://localhost:5173/student or http://localhost:5173/educator.
- Backend: http://localhost:5001/api/health returns HTTP 200 with `status: "OK"` and `database: "connected"` when MongoDB is ready; HTTP 503 indicates it is not connected.
- Worker: http://127.0.0.1:3001/health reports compiler readiness. This alone does not verify that every Mathlib module can be imported.

To check a Mathlib import and a small proof, run from `lean-worker`:

```bash
printf 'import Mathlib\nexample (n : Nat) : n + 0 = n := by simp\n' | lake env lean --stdin
```

From the repository root, the available checks are:

```bash
npm test
npm run lint
npm run build
```

`npm test` runs the frontend and backend test suites. It does not replace checking the running services.

## How puzzle loading works

`src/App.jsx` handles routes. `src/hooks/useAppState.js` chooses API puzzles or the bundled `PuzzleLoader` data based on the selected source, API health, and fetch errors. Educator publishing uses `src/services/puzzleManagerService.js` to save through the backend, with a browser-local fallback for certain network failures.

## Bundled JSON puzzle reference

The files are in `src/puzzles/data/`:

| File | Contents |
| --- | --- |
| `big-o-proofs.json` | Asymptotic notation proofs |
| `induction-proofs.json` | Induction proofs |
| `recursion-proofs.json` | Recursion proofs |
| `set-theory-proofs.json` | Set theory proofs |

Each file contains category metadata and a `puzzles` array. A minimal illustrative category file is:

```json
{
  "category": "Mathematical Induction",
  "description": "Example proof collection",
  "puzzles": [
    {
      "id": "example-nonnegative",
      "title": "n \\ge 0",
      "displayTitle": "Natural numbers are nonnegative",
      "statement": "\\text{For } n \\in \\mathbb{N}, n \\ge 0",
      "difficulty": "easy",
      "tags": ["natural-numbers"],
      "blocks": [
        { "id": "step-1", "latex": "n \\in \\mathbb{N}" },
        { "id": "step-2", "latex": "\\therefore n \\ge 0" }
      ],
      "solutionOrder": ["step-1", "step-2"]
    }
  ]
}
```

Use unique puzzle IDs, unique block IDs within each puzzle, and a `solutionOrder` containing those block IDs in the intended order. Difficulty is `easy`, `medium`, or `hard`. Escape LaTeX backslashes as `\\` inside JSON strings. Preserve existing puzzles when adding entries.

`src/services/puzzleLoader.js` imports these files and exposes:

- `getAllPuzzles()`, `getPuzzleById(id)`, and `getPuzzlesByCategory(category)`.
- `getPuzzlesByDifficulty(difficulty)`, `getPuzzlesByTags(tags)`, and `searchPuzzles(text)`.
- `getCategories()`, `getCategoryNames()`, `getRandomPuzzle()`, and `getRandomPuzzleFromCategory(category)`.

For loader category arguments, use the category names in the JSON files. Database imports use category keys such as `big-o` and `set-theory`; these are a separate convention. Existing named puzzle exports are re-exported through `src/puzzles/index.js`.

Changing bundled JSON affects local content; it does not automatically update MongoDB. The [database import](MIGRATION_GUIDE.md#import-bundled-puzzles) is a separate operation. The earlier JavaScript-to-JSON transition is preserved in the [archive](archive/JSON_MIGRATION_GUIDE.md).

## Troubleshooting

- **Backend unavailable:** confirm port 5001, the frontend API URL, and the backend logs. Restart Vite after changing its environment variables.
- **Database disconnected:** inspect the connection string and MongoDB access settings. The backend retries connections automatically; importing puzzles cannot fix a connection failure.
- **Database connected but empty:** import the bundled puzzles if wanted, or publish an educator puzzle.
- **Lean unavailable:** run `lake env lean --version` from `lean-worker`, then check setup and the Mathlib cache.
- **Generation fails:** check the server-side API key/model and worker health; local puzzles can still be used separately.
- **CORS errors:** development permits HTTP localhost/127.0.0.1 origins; production uses the configured `FRONTEND_URL`.
