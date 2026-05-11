FROM node:25-alpine as builder

WORKDIR /app
COPY . ./
RUN npm install
RUN npx tsc

FROM node:25-alpine
WORKDIR /app
COPY package*.json db.sql ./
COPY --from=builder /app/build ./build
RUN npm install --omit=dev

CMD ["node", "build/index.js"]
