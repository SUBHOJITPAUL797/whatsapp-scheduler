FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Install system dependencies for Baileys/Puppeteer if needed (Baileys doesn't need Puppeteer, but sometimes needs libs)
# Baileys is pure JS/TS, so usually fine.

COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy shared prisma schema
COPY prisma ./prisma/
# Note: In the final build context, we need to ensure this file exists. 
# I will create a copy in the worker directory to be safe.

COPY . .

RUN npx prisma generate
RUN npm run build

CMD ["sh", "-c", "npx prisma db push && npm start"]
