FROM mysql:8.0

RUN mkdir -p /docker-entrypoint-initdb.d

RUN echo "CREATE USER IF NOT EXISTS '\${MYSQL_USER}'@'%' IDENTIFIED BY '\${MYSQL_PASSWORD}'; \
  GRANT ALL PRIVILEGES ON *.* TO '\${MYSQL_USER}'@'%' WITH GRANT OPTION;" \
  > /docker-entrypoint-initdb.d/init.sql