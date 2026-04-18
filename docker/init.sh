#!/bin/bash

service cron start
php /var/www/html/artisan queue:work --verbose --tries=3 --timeout=90 &
php-fpm
