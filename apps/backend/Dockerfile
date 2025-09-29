# ---- Frontend build stage ----
FROM node:20-slim AS frontend-build
WORKDIR /fe

# Install dependencies
COPY apps/frontend/package*.json ./apps/frontend/
WORKDIR /fe/apps/frontend
RUN npm install

# Copy frontend source
COPY apps/frontend/ ./

# Build
ARG VITE_SHOW_RESET_BUTTON
ENV VITE_SHOW_RESET_BUTTON=$VITE_SHOW_RESET_BUTTON
RUN npm run build

# ---- Backend runtime stage ----
FROM node:20-slim AS backend-runtime
WORKDIR /app

# Install backend deps
COPY apps/backend/package*.json ./
RUN npm install --omit=dev

# Copy backend code
COPY apps/backend/server.js ./server.js

# Copy built frontend into /app/public
COPY --from=frontend-build /fe/apps/frontend/dist ./public

EXPOSE 3000
CMD ["node", "server.js"]