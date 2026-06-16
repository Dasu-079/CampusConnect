# Stage 1: Build React Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Prepare Express Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npx prisma generate

# Stage 3: Run Application
FROM node:20-alpine
WORKDIR /app
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/server ./server
WORKDIR /app/server
EXPOSE 5000
ENV NODE_ENV=production
CMD ["npm", "start"]
