# VUE 3D Canvas - Self-Hosted Production Dockerfile
# Author: Victory Ukpong
FROM node:20-alpine

WORKDIR /app

# Copy application files
COPY package.json ./
COPY server.js ./
COPY config.json ./
COPY public/ ./public/

# Create persistent storage directories
RUN mkdir -p storage/projects storage/textures

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose server port
EXPOSE 3000

# Volume for persistent project data
VOLUME ["/app/storage"]

# Run standalone server
CMD ["node", "server.js"]
