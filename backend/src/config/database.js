require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

const options = {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {},
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

let url = databaseUrl;

// Handle production SSL for Neon/Vercel Postgres
if (url && (process.env.NODE_ENV === 'production' || url.includes('neon.tech'))) {
  options.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

// Fallback to SQLite in development if no PostgreSQL URL is configured
if (!url) {
  options.dialect = 'sqlite';
  options.storage = ':memory:';
  options.logging = false;
  delete options.pool;
  console.log('⚠️ DATABASE_URL is not configured. Falling back to in-memory SQLite database.');
}

module.exports = {
  url,
  options,
};
