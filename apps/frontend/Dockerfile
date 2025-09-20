# Build stage
FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npm run build

# Runtime stage
FROM node:20-slim
WORKDIR /app

# Install only runtime deps
RUN npm install express basic-auth

# Copy build output + server
COPY --from=build /app/dist ./dist
COPY server.js ./server.js

# Expose port and run server
ENV PORT=8080
CMD ["node", "server.js"]