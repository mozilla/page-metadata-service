FROM node:6.3

WORKDIR /app
EXPOSE 7001 

COPY package.json /app/
RUN npm install

COPY . /app/
