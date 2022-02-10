# syntax=docker/dockerfile:1
#
# Two runtime images are built from this file:
#   --target api  the legacy Express service (off limits per the brief)
#   --target web  nginx serving the compiled SPA
# Build tooling stays in the build stages and never reaches either runtime.

# --------------------------------------------------------------- dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------- build the SPA
FROM deps AS build
# The API base URL is inlined into the bundle at build time, so it has to be
# known here rather than at container start.
ARG API_BASE_URL=http://localhost:8391
ENV API_BASE_URL=$API_BASE_URL
COPY .babelrc webpack.config.js ./
COPY src ./src
RUN npm run build

# ------------------------------------------------------- runtime: static web
FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
# nginx:alpine ships an unprivileged `nginx` user; give it the paths it writes.
RUN mkdir -p /tmp/nginx \
    && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /tmp/nginx
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]

# ------------------------------------------------------- runtime: legacy API
FROM node:22-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=8391
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
# The photos are committed to the repository, so the API is populated on first
# boot and needs no seed step.
COPY src/do-not-refactor ./src/do-not-refactor
USER node
EXPOSE 8391
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null \
        "http://127.0.0.1:${API_PORT}/static/images/nature/nature_1.jpeg" || exit 1
CMD ["node", "src/do-not-refactor/server.js"]
