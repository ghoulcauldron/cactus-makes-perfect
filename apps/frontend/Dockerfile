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

FROM nginx:alpine
WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]