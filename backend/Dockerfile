# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install native build tools for bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install native build tools for bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Only install production deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Remove build tools to keep image small
RUN apk del python3 make g++

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Create uploads dir
RUN mkdir -p uploads

EXPOSE 4000

CMD ["node", "dist/src/main"]
