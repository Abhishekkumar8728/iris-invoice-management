FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads

RUN chown -R node:node /app

ENV NODE_ENV=production

EXPOSE 4003

USER node

CMD ["node", "server.js"]
