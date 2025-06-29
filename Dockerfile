FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY tsconfig.node*.json ./
COPY vite.config.* ./
COPY .npmrc .npmrc

RUN npm install

COPY . .

RUN npm run build

FROM nginx:1.27.4-alpine-slim

# Copie le build dans Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Utiliser une configuration custom de Nginx (optimisée pour SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
