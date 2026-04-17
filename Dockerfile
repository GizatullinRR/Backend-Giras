FROM node:22-bookworm-slim

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build \
  && npm prune --omit=dev \
  && npm cache clean --force \
  && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]
