# Build context: backend/ (see docker-compose.yml)
FROM node:22-alpine

WORKDIR /app

# Production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Run as a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
