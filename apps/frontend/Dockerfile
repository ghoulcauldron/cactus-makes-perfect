# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install   # include devDependencies so vite is available

COPY . ./

# Make Railway env vars available to Vite at build time
ARG VITE_SHOW_RESET_BUTTON
ENV VITE_SHOW_RESET_BUTTON=$VITE_SHOW_RESET_BUTTON

RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim
WORKDIR /app

RUN npm install express basic-auth
COPY --from=build /app/dist ./dist
COPY server.js ./
COPY package.json ./

CMD ["node", "server.js"]