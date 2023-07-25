#/usr/bin/bash
# Run this script to update Docker
# john146/javascript-apps:tickets-nodejs-endpoint
nvm use  v16.18.1
echo "Logining in"
docker login
echo "Running NPM Build"
npm ci
echo "Running docker Build"
docker build . -t john146/javascript-apps:tickets-nodejs-endpoint-swartland
echo "Running docker push to server"
docker push john146/javascript-apps:tickets-nodejs-endpoint-swartland
