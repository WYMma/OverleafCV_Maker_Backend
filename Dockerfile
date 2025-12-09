# Backend Dockerfile
FROM node:18-alpine

# Install Docker client (for host Docker access)
RUN apk add --no-cache docker-cli

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create temp directory
RUN mkdir -p temp

EXPOSE 3001

# Add Docker socket access for host Docker
# Note: This requires mounting Docker socket when running
CMD ["npm", "start"]
