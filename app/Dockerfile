# ----------------------------
# Stage 1: Build TypeScript
# ----------------------------
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Copy package.json & package-lock.json
COPY package*.json ./

# Install all dependencies (dev + prod)
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript
RUN npx tsc

# ----------------------------
# Stage 2: Production image
# ----------------------------
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

# Copy environment files if any (optional)
# COPY .env ./

# Expose the port your app listens on
EXPOSE 3000

# Start the app
CMD ["node", "dist/server.js"]
