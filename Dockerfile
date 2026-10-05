# --- Etapa 1: Base ---
FROM node:20-alpine AS base
# Instalamos pnpm globalmente una sola vez aquí para que todas las etapas lo hereden
RUN npm install -g pnpm --force

# --- Etapa 2: Instalación de dependencias ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Ya no necesitamos forzar la instalación de pnpm aquí
RUN pnpm install --frozen-lockfile --ignore-scripts

# --- Etapa 3: Construcción (Build) ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Recibimos la variable de entorno pública de la API
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Ya no necesitamos forzar la instalación de pnpm aquí tampoco
RUN pnpm build

# --- Etapa 4: Imagen final de producción (Ligera) ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copiamos la compilación standalone optimizada por Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]