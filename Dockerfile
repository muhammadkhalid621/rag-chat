FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3005

CMD ["sh", "-c", "node src/scripts/migrate.js && node src/index.js"]
