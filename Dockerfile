# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# Copy SQL migrations into dist
RUN mkdir -p dist/db/migrations && cp src/db/migrations/*.sql dist/db/migrations/

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

RUN addgroup -S wasel && adduser -S wasel -G wasel
RUN chown -R wasel:wasel /app

USER wasel

EXPOSE 5000

CMD ["sh", "./docker-entrypoint.sh"]
