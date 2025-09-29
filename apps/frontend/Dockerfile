# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

COPY . ./
ARG VITE_SHOW_RESET_BUTTON
ENV VITE_SHOW_RESET_BUTTON=$VITE_SHOW_RESET_BUTTON

# ---- Runtime stage ----
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy built static files
COPY --from=build /app/dist ./

# Copy nginx template config
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# On startup, substitute $PORT into config and run nginx
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]