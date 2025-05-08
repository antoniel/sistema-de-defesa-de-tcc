FROM node:20-alpine AS base

FROM base AS pruner
WORKDIR /app
COPY . .
RUN npm install -g turbo@2.4.2
RUN turbo prune "@tcc/web" --docker

FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY package-lock.json .
RUN npm install --legacy-peer-deps

FROM base AS builder
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
COPY turbo.json package-lock.json ./
RUN npm run build --workspace=@tcc/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV PORT=5000
ENV VITE_API_URL=https://sistema-de-defesas-api.app.ic.ufba.br
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
CMD ["npm", "run", "start", "--workspace=@tcc/web"] 