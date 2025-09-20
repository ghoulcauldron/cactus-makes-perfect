FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npm run build

# Runtime image
FROM node:20-slim
WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/dist ./dist

# Railway injects $PORT, so bind to it
# Use exec form to avoid shell quirks
CMD ["serve", "-s", "dist", "-l", "0.0.0.0:$PORT", "-u", "guest:secretpass"]