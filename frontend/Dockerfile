FROM node:20-alpine AS builder
WORKDIR /frontend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build  
#this converts the frontend to basic html and js

FROM nginx:alpine AS final 
#the frontend is servered as plain html to browser via nginx
COPY --from=builder /frontend/dist /usr/share/nginx/html 
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80