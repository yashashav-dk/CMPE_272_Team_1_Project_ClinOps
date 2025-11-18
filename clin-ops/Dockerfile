FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm install

# Copy the rest of the application
COPY . .

# Environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Expose the app port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
