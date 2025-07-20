FROM node:20-alpine

# Install OpenSSL (needed by Prisma)
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy base files and install dependencies
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npm install

# Copy full project and build
COPY . .
RUN npm run build

# Expose the desired port
EXPOSE 5009

# Push Prisma schema to DB and start server
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm run start"]