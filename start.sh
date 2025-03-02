#!/bin/bash

echo "Starting the application..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "⚠️ ERROR: .env.local file is missing!"
  echo "➡️ Please create a .env.local file with your environment variables."
  echo "Example:"
  echo "NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key"  
  echo "NEXT_PUBLIC_PINATA_SECRET_API_KEY=your_pinata_secret_api_key"  
  echo "NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt"  
  echo "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token"
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
yarn install

# Build the application
echo "Building the application..."
yarn build

# Start the application
echo "Starting the Next.js application..."
yarn start
