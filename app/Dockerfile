FROM mhart/alpine-node:6.8.0

# S3 bucket in Cloud Services prod IAM
ADD https://s3.amazonaws.com/dumb-init-dist/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init
ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]

WORKDIR /app
EXPOSE 7001

COPY package.json /app/
RUN npm install

COPY . /app/
