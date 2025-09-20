FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npm run build

# Runtime image: use a tiny static server
FROM node:20-slim
WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/dist ./dist

# Railway injects $PORT, so bind to it
# Shell form allows $PORT to expand properly
CMD sh -c "serve -s dist -l $PORT -u guest:secretpass"