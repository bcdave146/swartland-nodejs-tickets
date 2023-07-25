FROM node:16

# Set environment variables
ENV NODE_ENV=production

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# Install mailutils for the /usr/bin/mail command
RUN apt-get update && apt-get install -y mailutils

EXPOSE 5020

# Define the app start command either commandline or package.json pointer
# CMD [ "node", "index.js"]
CMD [ "npm", "start"]
