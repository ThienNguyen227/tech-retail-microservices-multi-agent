
# syntax=docker/dockerfile:1

# =========================
# Stage 1: Build
# =========================
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client
RUN DATABASE_URL=postgresql://postgres:password@localhost:5432/branch_service?schema=public npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build

# =========================
# Stage 2: Production
# =========================
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma Client đã generate
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=build /app/dist ./dist

USER node

EXPOSE 3005

CMD ["node", "dist/main"]

# =========================
# Stage 3: Migration
# =========================
FROM build AS migrate

CMD ["npx", "prisma", "migrate", "deploy"]
