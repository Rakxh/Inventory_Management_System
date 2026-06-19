# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-inject-config.sh

RUN chmod +x /docker-entrypoint.d/40-inject-config.sh

EXPOSE 80

# The official nginx image already runs everything under
# /docker-entrypoint.d/ before starting nginx, so no custom ENTRYPOINT
# override is needed — our script just needs to be executable and present.
