#!/bin/bash
# Change to the project directory
cd /var/www/route-de-champlain

# Turn on maintenance mode
php artisan down

# Reset any changes
git reset --hard
# git pull latest change on master
git pull origin master

#make sure permission is ok
sudo chown -R www-data:www-data /var/www
sudo chmod -R g+rwX /var/www

# Install/update composer dependecies
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Run database migrations
php artisan migrate --force

# Clear caches
php artisan cache:clear

# Clear expired password reset tokens
php artisan auth:clear-resets

# Clear and cache routes
php artisan route:cache

# Clear and cache config
php artisan config:cache

# Install node modules
# npm install

# Build assets using Laravel Mix
# npm run production

#restart worker
php artisan queue:restart

# Turn off maintenance mode
php artisan up
