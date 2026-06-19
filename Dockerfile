FROM node:22-bookworm-slim
WORKDIR /app

COPY . .

WORKDIR /app/s3-json-viewer
RUN npm ci && npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "run", "start"]
