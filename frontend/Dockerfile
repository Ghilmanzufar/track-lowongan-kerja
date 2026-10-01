# ─────────────────────────────────────────────────────────────────
# Stage 1: Build Vite
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 2: Serve dengan Nginx
# ─────────────────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Hapus config default nginx
RUN rm /etc/nginx/conf.d/default.conf

# Salin nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Salin hasil build Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
