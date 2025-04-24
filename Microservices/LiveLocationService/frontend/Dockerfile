# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if exists) to install dependencies
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build
RUN npm install -g serve

# Expose the port the app will run on
EXPOSE 3000

# Start the server using 'serve' to serve the production build
CMD ["serve", "-s", "build", "-l", "3000"]
# Build the React app using the Node.js image
