FROM nginx:alpine

COPY src/ /usr/share/nginx/html/
#also:
#src/index.html wird zu /usr/share/nginx/html/index.html
#src/assets/... wird zu /usr/share/nginx/html/assets/...
#src/pages/... wird zu /usr/share/nginx/html/pages/...

