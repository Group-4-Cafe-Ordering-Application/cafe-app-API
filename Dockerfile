# Use an official Node.js 18 image as a base
FROM node:18

# Create app directory and set user permissions
RUN mkdir -p /app && chown -R node:node /app

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy .env file
COPY --chown=node:node .env ./

# Copy application code with proper ownership
COPY --chown=node:node . ./

# Copy app directory explicitly
COPY --chown=node:node ./app ./app

# Switch to 'node' user
USER node

# Expose port 3000 for incoming requests
EXPOSE 3000

# Run the command to start Node.js application
CMD ["node", "app/app.js"]
