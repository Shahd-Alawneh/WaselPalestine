#!/bin/sh

echo "Waiting for database..."

until node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).then(() => process.exit(0)).catch(() => process.exit(1));
"; do
  sleep 2
done

echo "Database is ready."
echo "Running migrations..."
npm run migrate

echo "Starting server..."
npm run start