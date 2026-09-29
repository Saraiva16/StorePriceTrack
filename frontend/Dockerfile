# Estágio 1: Build (Node)
FROM node:20-alpine AS build
WORKDIR /app
# Instala as dependências de forma limpa
COPY package*.json ./
RUN npm ci
# Copia o código e faz o build de produção (Vite)
COPY . .
RUN npm run build

# Estágio 2: Servidor Web (Nginx)
FROM nginx:alpine
# Copia a pasta de build (dist) do estágio anterior para o nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Substitui a configuração padrão do Nginx para suportar o React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
