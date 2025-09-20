# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install   # include devDependencies so vite is available

COPY . ./
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim
WORKDIR /app

# Only install runtime deps
RUN npm install express basic-auth

# Copy built frontend and server
COPY --from=build /app/dist ./dist
COPY server.js ./server.js

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.js"]