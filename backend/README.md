# Backend

Express API for Parsons Puzzles: puzzle storage in MongoDB, Astra generation with OpenAI and the Lean worker, and student feedback.

```bash
cp .env.example .env      # then set MONGODB_URI, OPENAI_API_KEY, OPENAI_MODEL
npm run dev               # or `npm run dev:backend` from the repository root
npm test
```

| Path | Contents |
| --- | --- |
| `server.js` | Express setup, CORS, rate limits, `/api/health` |
| `routes/` | `/api/puzzles`, `/api/generate`, `/api/feedback` |
| `services/` | Generation flow, OpenAI client, puzzle contract, Lean client, limits, database |
| `models/` | `Puzzle`, `PuzzleHistory`, `GenerationUsage`, `Feedback` |
| `scripts/` | `npm run migrate` imports the bundled puzzles; `npm run feedback:export` exports feedback |
| `test/` | `node:test` suites |

See the wiki for the [API reference](https://github.com/TimSeah/ParsonsPuzzleSUTD/wiki/API-Reference), [configuration](https://github.com/TimSeah/ParsonsPuzzleSUTD/wiki/Configuration) and [database setup](https://github.com/TimSeah/ParsonsPuzzleSUTD/wiki/Database).
