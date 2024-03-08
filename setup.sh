
# Get rid of existing modules folder & yarn.lock file
rm -rf node_modules yarn.lock

# Install the NVM defined node version
nvm install

# Install yarn as our build and package run tool
npm install -g yarn

# Install the node dependencies
yarn install

# Rebuild any modules that need it
yarn electron-rebuild
