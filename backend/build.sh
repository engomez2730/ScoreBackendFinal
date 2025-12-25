#!/bin/bash
echo "Starting Basketball Stats API deployment preparation..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

echo "Build completed successfully!"
