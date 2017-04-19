FROM node:6.10.2-alpine

# S3 bucket in Cloud Services prod IAM
ADD https://s3.amazonaws.com/dumb-init-dist/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init
ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]

WORKDIR /app
EXPOSE 7001

COPY package.json /app/
RUN npm install --production && rm -rf /root/.npm

COPY . /app/
