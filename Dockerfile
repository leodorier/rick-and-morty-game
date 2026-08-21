# ==========================================
# Stage 1: Build Static Vite Assets
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json ./

# Install dependencies cleanly
RUN npm install

# Copy source code and assets
COPY tsconfig.json vite.config.ts index.html ./
COPY public/ ./public/
COPY src/ ./src/

# Compile TypeScript and bundle Vite assets
RUN npm run build

# ==========================================
# Stage 2: Nginx Static Web Server
# ==========================================
FROM nginx:1.25-alpine AS runner

# Install curl and wget for healthchecks
RUN apk add --no-cache curl wget

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy compiled distribution bundle from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Healthcheck definition
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
