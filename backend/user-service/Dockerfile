# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
# `prisma.config.ts` validates DATABASE_URL while loading. This URL is only
# needed to generate the client; the actual URL is supplied by Compose at run time.
RUN DATABASE_URL=postgresql://postgres:password@localhost:5432/user_service?schema=public npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Prisma's generated client and native engine are produced in the build stage.
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3001

CMD ["node", "dist/main"]

# This target retains the Prisma CLI and is used only to run migrations.
FROM build AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]
