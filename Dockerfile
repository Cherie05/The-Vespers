# 100% Open-Source Production Dockerfile for VesperAero Server
# Node.js 20 Alpine Linux (Lightweight, Secure, Non-Root)

FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install production dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev && npm cache clean --force

# Copy application source code
COPY server/ ./server/
COPY data/ ./data/

# Create persistent storage directory & configure permissions
RUN mkdir -p /app/data && chown -R node:node /app

# Switch to non-root secure user
USER node

# Start VesperAero Server
CMD ["node", "server/index.js"]
