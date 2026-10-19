# Deployment

## Docker Compose

`docker-compose.yml` at the repository root builds each service from its own folder:

| Service | Build context | Image | Address |
| --- | --- | --- | --- |
| `frontend` | `frontend/` (`frontend/Dockerfile`, `frontend/nginx.conf`) | Node 22 build, served by Nginx | http://localhost:3000 |
| `backend` | `backend/` (`backend/Dockerfile`) | Node 22, production dependencies only, non-root user | http://localhost:5000/api |
| `mongodb` | — | `mongo:7` | localhost:27017 |

```bash
docker compose up --build
docker compose down          # stop (data stays in the mongodb_data volume)
```

The frontend's API URL is baked in at build time through the `VITE_API_BASE_URL` build argument (`http://localhost:5000/api` by default). Change it for remote users.

By default this setup has no Lean worker, so AI generation is unavailable; bundled and database puzzles, educator publishing and feedback work.

### With AI generation (Lean worker)

| Service | Build context | Image | Address |
| --- | --- | --- | --- |
| `lean-worker` | `lean-worker/` (`lean-worker/Dockerfile`) | Node 22 + Lean 4.32.0 + Mathlib cache, non-root user | Internal only: `http://lean-worker:3001` |

1. Put `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in `backend/.env`. Compose loads that file into the backend if it exists (Docker Compose 2.24 or newer); the database, port, CORS and Lean URL settings in `docker-compose.yml` override the file's local-development values.
2. Start the stack with the `generation` profile:

   ```bash
   docker compose --profile generation up --build
   ```

The first build downloads Lean and the prebuilt Mathlib cache, so it takes a while and the image is several GB. Each proof check loads Mathlib, so give Docker several GB of memory; the worker runs one compile at a time (`LEAN_MAX_CONCURRENT`) with a short queue (`LEAN_MAX_QUEUE`). The worker isn't published on the host; only the backend can reach it.

CI builds this image and checks that it accepts a correct proof and rejects a wrong one whenever `lean-worker/` changes (`.github/workflows/lean-worker-image.yml`).

## Settings

The backend reads its settings from environment variables; see [backend/.env.example](../backend/.env.example). The ones to review for any deployment:

| Setting | Why |
| --- | --- |
| `MONGODB_URI` | Database connection |
| `FRONTEND_URL` | Allowed CORS origin |
| `TRUST_PROXY` | Set (for example `1`) behind a reverse proxy or load balancer so rate limits use the client's IP instead of the proxy's |
| `OPENAI_API_KEY`, `LEAN_VERIFY_URL` | Needed for AI generation |
| `GENERATION_*`, `FEEDBACK_RATE_LIMIT_*` | Cost and abuse limits; defaults are listed in the [README](../README.md#api-overview) |

## Production cautions

- Authentication and authorization are not implemented. Add them before exposing puzzle writes or generation publicly.
- Run the Lean worker with its own sandbox and resource/network limits; see the [worker README](../lean-worker/README.md). The container runs Lean as a non-root user on a private network, but it is not a hardened sandbox.
- Generated puzzles are reused only if they were verified under the current Lean policy version. After a policy change, AI requests generate fresh puzzles until the cache refills.
