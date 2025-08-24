FROM node:alpine

# Update packages to get security fixes; aws-cli no longer required because we rely on host .npmrc
RUN apk update && apk upgrade && apk add --no-cache dumb-init bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Optional build arg for private registry token (do NOT bake into final image unless necessary)
ARG CODEARTIFACT_TOKEN

# Registry configuration (public + scoped)
ENV NPM_DEFAULT_REGISTRY=https://registry.npmjs.org/

# Adjust this to your CodeArtifact or private registry base if needed
ARG VSPL_SCOPE_REGISTRY=https://yfi-047028506553.d.codeartifact.ap-south-1.amazonaws.com/npm/yfi/
ENV VSPL_SCOPE_REGISTRY=${VSPL_SCOPE_REGISTRY}

# Install dependencies with proper handling of private @vspl scope. Fail fast if token required but missing.
RUN rm -f ~/.npmrc

RUN echo "registry=${NPM_DEFAULT_REGISTRY}" > ~/.npmrc && \
    echo "@vspl:registry=${VSPL_SCOPE_REGISTRY}" >> ~/.npmrc && \
    if [ -n "$CODEARTIFACT_TOKEN" ]; then \
    echo "//$(echo ${VSPL_SCOPE_REGISTRY} | sed -e 's~^https://~~' -e 's~/$~~')/:_authToken=${CODEARTIFACT_TOKEN}" >> ~/.npmrc; \
    fi

# Copy application code (excluding node_modules via .dockerignore)
COPY . .

# Remove entire node_modules and package-lock.json to ensure clean slate
RUN rm -rf node_modules package-lock.json

# Install dependencies from scratch (fresh resolution from package.json only)
RUN npm install

# Build the application
RUN npm run build

# Expose the port
ARG PORT
EXPOSE ${PORT}

# Command to run the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]