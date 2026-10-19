# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
