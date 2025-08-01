FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies - use ci if package-lock.json exists, otherwise use install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose the port
ENV PORT=5001
EXPOSE 5001

# Command to run the application
CMD ["node", "dist/app.js"]