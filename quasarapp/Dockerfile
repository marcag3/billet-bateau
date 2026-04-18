FROM node:lts
WORKDIR /quasarapp
RUN apt-get update && apt-get install -y git
RUN apt-get clean && rm -rf /var/lib/apt/lists/*
RUN yarn global add @quasar/cli
# COPY . .

# Copy existing application directory permissions
# COPY --chown=node:node . .

# Change current user to node
USER node
