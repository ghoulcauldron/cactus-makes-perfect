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

# Copy only what’s needed: dist, server.js, and package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/package.json ./package.json

RUN npm install express basic-auth

EXPOSE 8080
CMD ["node", "server.js"]