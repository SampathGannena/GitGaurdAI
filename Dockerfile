FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server ./server
RUN npm ci --only=production || true
EXPOSE 3000
CMD ["node", "server/index.js"]
