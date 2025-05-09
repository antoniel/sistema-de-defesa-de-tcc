FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
WORKDIR /app/apps/server
ENV PORT=9000
EXPOSE 9000
CMD ["npm", "run", "dev", "--workspace=@tcc/server"] 