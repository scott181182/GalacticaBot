FROM node:16.14
COPY package.json package-lock.json tsconfig.json tslint.json /app/
COPY ./src/ /app/src/
WORKDIR /app/
RUN npm i && npm run build
CMD npm start