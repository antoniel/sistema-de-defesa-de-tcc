FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
WORKDIR /app/apps/server
ENV PORT=80
EXPOSE 80
CMD ["npm", "run", "dev", "--workspace=@tcc/server"] 