# Backend Dockerfile
FROM node:18-alpine

# Install LaTeX (TeX Live) for direct compilation
RUN apk add --no-cache texlive-full

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create temp directory
RUN mkdir -p temp

EXPOSE 3001

CMD ["npm", "start"]
