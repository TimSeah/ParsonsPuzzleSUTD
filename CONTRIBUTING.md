# Contributing

Thanks for helping improve Parsons Puzzles. Full documentation is in the [wiki](https://github.com/TimSeah/ParsonsPuzzleSUTD/wiki).

## Get it running

You need [Node.js](https://nodejs.org/) 22.12 or newer (see `.nvmrc`).

```bash
git clone https://github.com/TimSeah/ParsonsPuzzleSUTD.git
cd ParsonsPuzzleSUTD
npm start
```

On Windows you can also double-click `start.cmd`; on macOS or Linux run `./start.sh`. Both only run `npm start`.

`npm start` runs `scripts/dev.mjs`, a dependency-free script you can read before running. It:

- asks before installing anything, and only runs `npm ci` from the committed lockfiles;
- starts the frontend, plus the API when `backend/.env` points at a MongoDB, plus the Lean worker when Lean and Mathlib are installed;
- picks free ports if the usual ones are busy, and stops everything on Ctrl+C.

Without a backend the app uses its bundled puzzles, which is enough to work on most of the frontend.

`npm run doctor` checks your setup without starting or changing anything, and tells you how to enable the rest.

### No local installs: dev container

Open the repository in [GitHub Codespaces](https://github.com/codespaces) or in VS Code with the Dev Containers extension. You get Node 22 and a MongoDB, dependencies are installed for you, and `npm start` runs the frontend and API. The Lean worker is not included because it needs several GB; see [lean-worker/README.md](lean-worker/README.md) if you need it.

### Full setup

For the database, OpenAI and Lean, follow [Getting started](https://github.com/TimSeah/ParsonsPuzzleSUTD/wiki/Getting-Started).

## Making a change

1. Create a branch from `main`.
2. Make your change, with tests where it makes sense. Tests live next to the code (`*.test.js` / `*.test.jsx`).
3. Run `npm run lint`, `npm test` and `npm run build`.
4. Open a pull request. CI must pass before it is merged.
5. If you change behaviour, update the wiki page that describes it.

Keep secrets in `backend/.env`; it is ignored by Git. Never put them in a `VITE_` variable, because those are sent to the browser.
