FROM node:24-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/admin ./apps/admin
COPY packages ./packages

RUN pnpm install --frozen-lockfile

ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

RUN pnpm --filter admin run build

FROM nginx:alpine AS runner

COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

