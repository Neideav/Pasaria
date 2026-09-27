FROM php:8.2-fpm-alpine

# Install system dependencies & PHP extensions for Laravel & MariaDB
RUN apk add --no-cache \
    curl \
    git \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    oniguruma-dev \
    mariadb-client \
    linux-headers

RUN docker-php-ext-install pdo pdo_mysql mbstring bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/shopcart

# Copy project files
COPY . /var/www/shopcart

# Set permissions
RUN chown -R www-data:www-data /var/www/shopcart \
    && chmod -R 775 /var/www/shopcart/database

EXPOSE 9000

CMD ["php-fpm"]
