FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps --workspace=@tcc/server
WORKDIR /app/apps/server
ENV PORT=9000
EXPOSE 9000
CMD ["npm", "run", "start", "--workspace=@tcc/server"] 