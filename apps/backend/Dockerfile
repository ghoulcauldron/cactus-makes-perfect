# ---- Build frontend ----
FROM node:20-slim AS fe
WORKDIR /fe
COPY ../frontend/package*.json ./
RUN npm install
COPY ../frontend ./
RUN npm run build

# ---- Backend runtime ----
FROM node:20-slim
WORKDIR /app

# Backend deps
COPY ./package*.json ./
RUN npm install --omit=dev

# Backend source
COPY . .

# Bring frontend build into /app/dist
COPY --from=fe /fe/dist ./dist

EXPOSE 3000
CMD ["node", "server.js"]