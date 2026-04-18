#!/bin/sh
# cd quasarapp
# quasar build
# cd ..
docker exec quasar quasar build
docker exec laravel npm run prod
# yarn run prod
git add .
git commit -m "$1"
git pull
git push
