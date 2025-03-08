# First stage: Install dependencies and build the Next.js app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install Git and OpenSSH (Required for private repos)
RUN apk add --no-cache git openssh

# Copy only the package files for dependency caching
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the project files
COPY . .

# Ensure Next.js picks up the environment variables
ENV NODE_ENV=production

# Build the Next.js app
RUN yarn build

# Second stage: Serve the production build with a minimal image
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Install Git and OpenSSH (Required for private repos)
RUN apk add --no-cache git openssh

# Install dependencies (ensures production dependencies are available)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy built files from the first stage (builder)
COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/.env.local .env.local

# Expose the port Next.js runs on
EXPOSE 3000

# Start the Next.js application
CMD ["yarn", "start"]
