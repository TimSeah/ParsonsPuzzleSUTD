# Lean verification worker

Local-development worker for compiling generated Lean 4 proofs against a pinned Mathlib release.

```bash
npm run setup
npm start
npm test   # verification policy unit tests (no Lean installation needed)
```

It listens on `127.0.0.1:3001` by default and runs one compile at a time with a short queue. Settings are on the wiki's [Configuration](https://github.com/TimSeah/ParsonsPuzzleSUTD/wiki/Configuration) page; how the backend uses the result is on [Generation and verification](https://github.com/TimSeah/ParsonsPuzzleSUTD/wiki/Generation-and-Verification).

## API

`POST /verify` with `{ "source": "<Lean file>", "theoremName": "<name>", "timeoutMs": 30000 }`.

The response includes `status` (`verified`, `rejected`, `timeout` or `infrastructure_error`), `valid`, `diagnostics`, the `axioms` the theorem depends on, and `policyChecks`:

| Check | Meaning |
| --- | --- |
| `noUnsolvedGoals` | Lean exited successfully with no error messages |
| `noSorry` / `noAdmit` | The theorem does not depend on `sorryAx` and Lean did not report `declaration uses 'sorry'` |
| `noWarnings` | No warnings other than Lean linter warnings (for example unused variables) |
| `theoremChecked` | The worker's own `#print axioms <theoremName>` (appended after the source) produced a report |
| `allowedAxioms` | The theorem only uses `propext`, `Classical.choice` and `Quot.sound` |
| `allowedImports` | Every imported module is `Mathlib` or `Mathlib.*` |

A proof is `verified` only if every check is true. The backend (`backend/services/leanClient.js`) also requires each check to be reported explicitly, so an older worker that doesn't run them is treated as a rejection.

## Source policy

Before compiling, `verifier.js` rejects sources (ignoring comments) that:

- don't declare `theoremName` as a top-level `theorem`/`lemma`;
- import anything outside Mathlib (all modules on every `import` line are checked);
- use `sorry`/`admit`, `axiom`, `unsafe`, `implemented_by`, `extern` or `native_decide`;
- use `#eval`, `#print`, `#exit`, `#check` and similar commands;
- define macros, syntax, notation or elaborators, or run metaprograms (`run_cmd`, `elab`, `macro`, `notation`, `initialize`, syntax quotations, ...);
- reference the `Lean` metaprogramming namespace or APIs such as `Elab`, `Meta`, `addDecl` or `logInfo`;
- use attributes other than a small allowlist (`simp`, `ext`, `reducible`, `irreducible`, `norm_cast`, `push_cast`, `symm`, `refl`, `trans`, `gcongr`, `mono`). Attributes like `@[command_elab]`, `@[tactic]` or `@[init]` could register code that runs during elaboration;
- contain string literals or `«»`-quoted names (proofs don't need them, and they could hide a comment opener from these checks);
- reference `IO`/`BaseIO`/`EIO`/`System`, `ofReduceBool`/`trustCompiler`, or set `debug.*` options (for example `debug.skipKernelTC`).

The worker runs `lake env lean --json` and parses Lean's structured messages. The axioms report is only trusted if it comes from the line the worker appended, so a source can't fake it with its own output or skip it with `#exit`. Lint-style warnings (kinds `linter.*` / `Lean.Linter.*`, such as unused variables or deprecated names) don't fail verification; all other warnings do.

**Known limitation:** the axioms report comes from elaborating the untrusted file itself, so the source policy above is what stops a proof from replacing the `#print axioms` command. A stronger design is to compile the proof to an `.olean` and read its axioms (and re-check it in the kernel, e.g. with lean4checker) in a separate trusted process.

## Deployment

The `Dockerfile` builds an image with the pinned toolchain and Mathlib cache, running as a non-root user. Run it in its own container with no network access and CPU, memory and process limits: the source policy is defence in depth, not a sandbox. See [Deployment](https://github.com/TimSeah/ParsonsPuzzleSUTD/wiki/Deployment).
