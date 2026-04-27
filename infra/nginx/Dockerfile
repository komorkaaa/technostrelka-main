# syntax=docker/dockerfile:1.6
FROM node:20.16.0-alpine AS builder

WORKDIR /app

ARG VITE_BUILD_REF=local
ARG VITE_BUILD_TIME=unknown
ENV VITE_BUILD_REF=$VITE_BUILD_REF
ENV VITE_BUILD_TIME=$VITE_BUILD_TIME

COPY frontend/package.json /app/frontend/package.json
COPY frontend/tsconfig.json /app/frontend/tsconfig.json
COPY frontend/vite.config.ts /app/frontend/vite.config.ts
COPY frontend/index.html /app/frontend/index.html
COPY frontend/src /app/frontend/src

WORKDIR /app/frontend
RUN npm install --no-audit --no-fund
RUN npm run build

FROM nginx:1.27.4-alpine

RUN apk add --no-cache openssl

COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf
COPY infra/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY infra/nginx/docker-entrypoint.d/10-generate-cert.sh /docker-entrypoint.d/10-generate-cert.sh

RUN sed -i 's/\r$//' /docker-entrypoint.d/10-generate-cert.sh \
  && chmod +x /docker-entrypoint.d/10-generate-cert.sh \
  && mkdir -p /etc/nginx/certs

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80 443
