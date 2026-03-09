FROM node:20-alpine

WORKDIR /app

ARG JWT_SECRET
ARG DATABASE_URL

ENV JWT_SECRET=$JWT_SECRET
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]