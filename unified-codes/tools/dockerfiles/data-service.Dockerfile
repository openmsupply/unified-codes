FROM node:lts-alpine
WORKDIR /app
COPY ./dist/apps/data-service .
EXPOSE 4000
RUN npm install --production
CMD node ./main.js