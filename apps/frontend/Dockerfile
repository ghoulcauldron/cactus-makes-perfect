FROM node:20-slim AS build
WORKDIR /app

# Copy dependency manifests first
COPY package*.json ./
RUN npm install

# Copy source
COPY . ./
RUN npm run build

# Serve built site
FROM node:20-slim
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm install --omit=dev

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
