# =====================================================================
# Stage 1: Build Production Frontend Assets with Node 22 (Alpine)
# =====================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests and install cleanly
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy application source code and compile optimized production bundle
COPY . .
RUN npm run build

# =====================================================================
# Stage 2: Production Nginx Server for Static Assets & API Proxy
# =====================================================================
FROM nginx:1.27-alpine AS runner

# Install wget for container health checks
RUN apk add --no-cache wget

# Copy production Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
