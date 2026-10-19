# Lean verification worker

Local-development worker for compiling generated Lean 4 proofs against a pinned Mathlib release.

```bash
npm run setup
npm start
```

The worker listens only on `127.0.0.1:3001`, rejects forbidden placeholders and non-Mathlib imports, limits request/source size, invokes Lake without a shell, enforces a timeout, and deletes each temporary proof file.

For production, run this worker in a separate network-disabled container with filesystem, CPU, memory, process, and request limits. The local process boundary is not a complete security sandbox.
