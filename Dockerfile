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

# Install curl for the healthcheck and prepare writable paths for the unprivileged user.
# nginx writes only to its cache dir (chowned below) and /tmp (pid + temp paths, see nginx.conf).
RUN apk add --no-cache curl \
 && chown -R nginx:nginx /var/cache/nginx

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Fail the build fast if the nginx configuration is invalid. `nginx -t` writes
# a root-owned pid file (and temp dirs) under /tmp, which the unprivileged
# runtime user could not later overwrite, so clean them up afterwards.
RUN nginx -t \
 && rm -rf /tmp/nginx.pid /tmp/client_temp /tmp/proxy_temp \
           /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp

# Copy compiled distribution bundle from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Static assets are owned by the unprivileged runtime user
RUN chown -R nginx:nginx /usr/share/nginx/html

# Run the whole server (master + workers) as non-root.
# Port 80 still binds thanks to Docker's default net.ipv4.ip_unprivileged_port_start=0
# (Docker >= 20.10); see SECURITY.md for the post-recreate verification step.
USER nginx

# Expose standard HTTP port
EXPOSE 80

# Healthcheck definition
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
