# ==========================================
# Stage 1: Build Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Explicitly use public npm registry to avoid JFrog/Enterprise registry auth issues
RUN npm config set registry https://registry.npmjs.org/

# Install dependencies using package.json only to bypass private URLs in package-lock.json
COPY frontend/package.json ./
RUN npm install

# Copy the rest of the frontend source and build
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Backend
# ==========================================
FROM node:20-alpine AS backend-builder
WORKDIR /app

# Explicitly use public npm registry
RUN npm config set registry https://registry.npmjs.org/

# Install dependencies using package.json only
COPY package.json ./
RUN npm install

# Copy backend source and compile TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build:backend

# ==========================================
# Stage 3: Production Runner
# ==========================================
FROM node:20-alpine AS production
WORKDIR /app

# Set Node to run in production mode
ENV NODE_ENV=production

# Explicitly use public npm registry
RUN npm config set registry https://registry.npmjs.org/

# Install only production dependencies using package.json only
COPY package.json ./
RUN npm install --omit=dev

# Copy compiled backend
COPY --from=backend-builder /app/dist ./dist

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose standard Cloud Run port
EXPOSE 8080
ENV PORT=8080

# Expose websocket port 
EXPOSE 8081
ENV WS_PORT=8081

# Start the application
CMD ["node", "dist/server/index.js"]
