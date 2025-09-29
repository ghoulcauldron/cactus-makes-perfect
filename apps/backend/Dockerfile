# ---- Frontend build stage ----
FROM node:20-slim AS frontend-build
WORKDIR /fe/apps/frontend

COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

COPY . ./

ARG VITE_SHOW_RESET_BUTTON
ENV VITE_SHOW_RESET_BUTTON=$VITE_SHOW_RESET_BUTTON

# ---- Backend runtime stage ----
FROM node:20-slim AS backend-runtime
WORKDIR /be/apps/backend

COPY server.js ./
COPY --from=frontend-build /fe/apps/frontend/dist ./public

RUN npm install express

EXPOSE 3000
CMD ["node", "server.js"]