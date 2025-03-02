# Use the official Node.js image
FROM node:18-alpine

# Install Git (Required for some dependencies)
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock first for caching
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Ensure ts-node is installed globally
RUN yarn global add ts-node

# Copy the entire project
COPY . .

# Expose the backend port (change if needed)
EXPOSE 5000

# Start the backend using ts-node
CMD ["yarn", "dev"]
