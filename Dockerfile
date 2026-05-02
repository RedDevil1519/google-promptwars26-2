# Build the frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Build the backend
FROM node:20-alpine AS build-backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Final production image
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY --from=build-backend /app/backend/package*.json ./backend/
COPY --from=build-backend /app/backend/dist ./backend/dist
WORKDIR /app/backend
RUN npm install --production

# Copy frontend
COPY --from=build-frontend /app/frontend/dist /app/frontend/dist

# Expose port (Cloud Run expects PORT environment variable, defaults to 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "run", "start"]
