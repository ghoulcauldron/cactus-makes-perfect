# apps/frontend/Dockerfile

# Use nginx to serve static files
FROM nginx:alpine

# Copy built Vite output into nginx's default html dir
COPY dist /usr/share/nginx/html

# Expose nginx default port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]