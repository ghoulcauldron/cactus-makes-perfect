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
# Make sure only one path argument (./dist) is given
CMD sh -c "serve -s ./dist -l $PORT -u guest:secretpass"