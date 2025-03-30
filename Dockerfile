FROM --platform=linux/amd64 node:20-alpine as builder

WORKDIR /app

# Configure yarn with increased timeouts and network settings
RUN yarn config set network-timeout 600000 && \
    yarn config set httpRetry 3 && \
    yarn config set httpTimeout 60000

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./
COPY .yarn ./.yarn
COPY .yarnrc ./

# Install dependencies with increased timeout
RUN yarn install --frozen-lockfile --network-timeout 600000 || \
    (sleep 5 && yarn install --frozen-lockfile --network-timeout 600000) || \
    (sleep 10 && yarn install --frozen-lockfile --network-timeout 600000)

# Copy application source
COPY . .

# Build both frontend and backend with reduced memory usage and NO NX DAEMON
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NX_DAEMON=false
ENV NX_SKIP_NX_CACHE=true

# Build frontend
RUN yarn nx build frontend --skip-nx-cache || \
    (sleep 5 && yarn nx build frontend --skip-nx-cache)

# Build backend
RUN yarn nx build backend --skip-nx-cache || \
    (sleep 5 && yarn nx build backend --skip-nx-cache)

# Production image
FROM --platform=linux/amd64 node:20-alpine

WORKDIR /app

# Configure yarn with increased timeouts
RUN yarn config set network-timeout 600000 && \
    yarn config set httpRetry 3 && \
    yarn config set httpTimeout 60000

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./
COPY .yarn ./.yarn
COPY .yarnrc ./

# Install production dependencies only with increased timeout
RUN yarn install --frozen-lockfile --production --network-timeout 600000 || \
    (sleep 5 && yarn install --frozen-lockfile --production --network-timeout 600000) || \
    (sleep 10 && yarn install --frozen-lockfile --production --network-timeout 600000)

# Copy built applications from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
# Limit Node.js memory usage in production
ENV NODE_OPTIONS="--max-old-space-size=192"

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/apps/backend/main.js"] 