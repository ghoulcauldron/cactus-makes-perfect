# apps/backend/Dockerfile

FROM node:20-slim
WORKDIR /app

# Copy package metadata first for better caching
COPY package*.json ./

# Install runtime deps only (Express + basic-auth + your others from package.json)
RUN npm install --omit=dev

# Copy app source
COPY . .

# Expose backend port
EXPOSE 3000

# Start the Express server
CMD ["node", "server.js"]