# ========= Build frontend (requires repo-root build context) =========
FROM node:20-slim AS fe
WORKDIR /fe

# Install FE deps
COPY apps/frontend/package*.json ./
RUN npm install

# Build FE
COPY apps/frontend/ ./
RUN npm run build

# ========= Backend runtime =========
FROM node:20-slim
WORKDIR /app

# Install backend deps
COPY apps/backend/package*.json ./
RUN npm install --omit=dev

# Copy ONLY the backend files we actually need (avoid .dockerignore pitfalls)
COPY apps/backend/server.js ./server.js
# If you have other backend source files, add them explicitly:
# COPY apps/backend/src ./src
# COPY apps/backend/*.mjs ./

# Bring FE build into /app/dist so Express can serve it
COPY --from=fe /fe/dist ./dist

EXPOSE 3000
CMD ["node", "server.js"]