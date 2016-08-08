FROM nginx:1.9.9

RUN rm /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-site.conf /etc/nginx/conf.d/

COPY fullchain.pem /etc/ssl/metadata.dev.mozaws.net.pem
COPY privkey.pem /etc/ssl/metadata.dev.mozaws.net.key
