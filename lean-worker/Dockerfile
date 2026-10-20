# Build context: lean-worker/ (see docker-compose.yml, profile "generation")
# Lean + Mathlib make this a large image (several GB); first build downloads the Mathlib cache.
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git \
 && rm -rf /var/lib/apt/lists/*

# Run Lean as a non-root user
RUN useradd --create-home --uid 1001 lean
USER lean
WORKDIR /home/lean/worker
ENV ELAN_HOME=/home/lean/.elan
ENV PATH=/home/lean/.elan/bin:$PATH

# Lean toolchain pinned by lean-toolchain
COPY --chown=lean lean-toolchain ./
RUN curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh \
      | sh -s -- -y --no-modify-path --default-toolchain none \
 && elan toolchain install "$(cat lean-toolchain)"

# Mathlib at the revision pinned in lake-manifest.json, with its prebuilt cache
COPY --chown=lean lakefile.toml lake-manifest.json ./
RUN lake exe cache get

COPY --chown=lean package.json server.js verifier.js limiter.js Checker.lean ./

ENV HOST=0.0.0.0
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3001/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
