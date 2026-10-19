# Database setup and puzzle import

Checked against the local project on 18 September 2026. The filename is retained for existing references. Frontend database integration is already implemented; no frontend migration is needed.

## Configure MongoDB

Choose a running local MongoDB instance or MongoDB Atlas. In `server/.env`, set:

```env
MONGODB_URI=mongodb://localhost:27017/parsonspuzzle
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

For Atlas, create a cluster and database user, allow your development machine's IP, and use the connection string supplied by Atlas instead of the local URI. Include the intended database name. Keep credentials in `server/.env` and out of version control.

See [Development](DEVELOPMENT.md) for dependency installation and the full application setup. From the repository root, start the backend:

```bash
npm run dev:server
```

Open http://localhost:5001/api/health. A ready database produces HTTP 200 with `status: "OK"` and `database: "connected"`. HTTP 503 means the database is not connected yet; the backend retries automatically.

## Import bundled puzzles

Import only when you want the bundled JSON puzzles copied into the database, such as when populating a new database. It is not a required step on every startup.

From the repository root:

```bash
npm --prefix server run migrate
```

The script connects directly to MongoDB using `server/.env`; the HTTP backend need not be running. It reads the four files in `src/puzzles/data/` and assigns the database categories `big-o`, `induction`, `recursion`, and `set-theory`.

**Existing IDs are updated, not skipped.** The script replaces matching puzzle fields with bundled values, resets creation/update timestamps, and marks matching puzzles active. It does not delete unrelated puzzles. Back up a database containing edits you need to preserve before re-importing.

Inspect the output for individual puzzle errors. The current script can report completion even when some imports failed, so verify the resulting records as well.

## Verify the result

With the backend running, inspect:

- http://localhost:5001/api/puzzles — first page of active puzzles; `pagination.total` gives the total count.
- http://localhost:5001/api/puzzles/category/big-o — imported Big O puzzles.

Then open Student mode and check that database puzzles load. The frontend also has local bundled puzzles, so seeing a puzzle alone does not prove that the database import succeeded.

## Troubleshooting

- **Cannot connect:** check that local MongoDB is running, or that Atlas permits your IP and the database credentials are correct.
- **Authentication error:** verify the database user and URI encoding of special characters in the password.
- **Empty results:** inspect import errors and confirm that the backend and importer use the same database URI.
- **Unexpected overwritten puzzle:** the importer updates by puzzle ID; restore the affected record from your backup if needed.

For the bundled file format, see the [JSON reference](DEVELOPMENT.md#bundled-json-puzzle-reference). For normal educator publishing, see the [Educator guide](EDUCATOR_GUIDE.md).
