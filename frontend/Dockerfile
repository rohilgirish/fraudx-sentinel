FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy application files
COPY . .

EXPOSE 5173

# Run the dev server exposing it to the network
CMD ["npm", "run", "dev", "--", "--host"]
