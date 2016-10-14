FROM mhart/alpine-node:6.8.0

WORKDIR /app
EXPOSE 7001

COPY package.json /app/
RUN npm install

COPY . /app/
