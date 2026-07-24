# PostEverywhere MCP server — stdio transport.
# Build: docker build -t posteverywhere-mcp .
# Run:   docker run -i --rm -e POSTEVERYWHERE_API_KEY=pe_live_... posteverywhere-mcp
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
ENTRYPOINT ["node", "dist/index.js"]
