FROM node:20-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Create entrypoint script to inject env vars into config.js
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'echo "Generating config.js with VITE_API_HOST=$VITE_API_HOST"' >> /docker-entrypoint.sh && \
    echo 'echo "window.env = {" > /usr/share/nginx/html/config.js' >> /docker-entrypoint.sh && \
    echo 'echo "  VITE_API_HOST: \"$VITE_API_HOST\"" >> /usr/share/nginx/html/config.js' >> /docker-entrypoint.sh && \
    echo 'echo "};" >> /usr/share/nginx/html/config.js' >> /docker-entrypoint.sh && \
    echo 'exec "$@"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
