# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

# Install only build dependencies (no express/basic-auth here)
COPY package*.json ./
RUN npm install --omit=dev

COPY . ./
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim
WORKDIR /app

# Install only what's needed at runtime: express + basic-auth
COPY package*.json ./
RUN npm install express basic-auth

# Copy built frontend assets and server
COPY --from=build /app/dist ./dist
COPY server.js ./server.js

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.js"]
