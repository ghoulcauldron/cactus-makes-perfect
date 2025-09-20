FROM node:20-slim AS build
WORKDIR /app

COPY apps/frontend/package*.json ./
RUN npm install

COPY apps/frontend ./
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY apps/frontend/package*.json ./
RUN npm install --omit=dev

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
