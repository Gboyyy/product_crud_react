FROM php:8.4-apache
RUN docker-php-ext-install pdo_mysql && a2enmod rewrite
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf
COPY . /var/www/html/
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|' /etc/apache2/sites-available/000-default.conf \
 && chown -R www-data:www-data /var/www/html/runtime \
 && sed -i 's/\r$//' /var/www/html/docker-entrypoint.sh \
 && chmod +x /var/www/html/docker-entrypoint.sh
EXPOSE 10000
CMD ["/var/www/html/docker-entrypoint.sh"]
