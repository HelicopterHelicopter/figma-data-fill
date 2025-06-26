# ---- Base Stage ----
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS dependencies

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# ---- Build Stage ----
FROM base AS build

# Copy dependencies from the dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy the rest of the application source code
COPY . .

# Build the TypeScript code
RUN npm run build

# ---- Production Stage ----
FROM base AS production

# Set environment to production
ENV NODE_ENV=production

# Copy built code and dependencies from previous stages
COPY --from=build /app/dist ./dist
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD [ "node", "dist/index.js" ]