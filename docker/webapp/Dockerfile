# Dockerfile
FROM node:18-alpine

# Install necessary tools
RUN apk add --no-cache bash

# Set the working directory
WORKDIR /app

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the http-server port
EXPOSE 8080
EXPOSE 9229

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]
