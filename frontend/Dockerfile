### Stage 1: Build the Angular application
FROM node:22-alpine as builder
WORKDIR /ng-app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

### Stage 2: Serve the application with Nginx
FROM nginx:alpine AS runner
## Copy default nginx config
COPY nginx/default.conf /etc/nginx/conf.d/

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

## From ‘builder’ stage copy over the artifacts in dist folder to default nginx public folder
COPY --from=builder /ng-app/dist/frontend/browser /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]