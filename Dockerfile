FROM --platform=linux/amd64 node:20-alpine as builder

WORKDIR /app

# Enable Corepack and prepare yarn
RUN corepack enable && corepack prepare yarn@4.9.1 --activate

# Copy package.json, yarn.lock and yarn configuration
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install

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

# Enable Corepack and prepare yarn
RUN corepack enable && corepack prepare yarn@4.9.1 --activate

# Copy package.json, yarn.lock and yarn configuration
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install production dependencies only
RUN yarn install --production

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