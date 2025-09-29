# ===== Frontend build =====
FROM node:20-slim AS fe
WORKDIR /fe/apps/frontend

# Install deps
COPY apps/frontend/package*.json ./
RUN npm ci

# Copy source & build
COPY apps/frontend/ ./
ARG VITE_SHOW_RESET_BUTTON
ENV VITE_SHOW_RESET_BUTTON=$VITE_SHOW_RESET_BUTTON
RUN npm run build

# ===== Backend runtime =====
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Install backend deps
COPY apps/backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend code (server + any helpers you have)
COPY apps/backend/ ./

# Serve built frontend from /app/public
COPY --from=fe /fe/apps/frontend/dist ./public

EXPOSE 3000
CMD ["node", "server.js"]