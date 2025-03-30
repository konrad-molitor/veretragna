FROM node:20-alpine as builder

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./
COPY .yarn ./.yarn
COPY .yarnrc ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy application source
COPY . .

# Build both frontend and backend with reduced memory usage
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN yarn nx build frontend
RUN yarn nx build backend

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./
COPY .yarn ./.yarn
COPY .yarnrc ./

# Install production dependencies only
RUN yarn install --frozen-lockfile --production

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