FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps --workspace=@tcc/server
WORKDIR /app/apps/server
EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace=@tcc/server"] 