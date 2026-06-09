require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

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
if (url && url.startsWith('postgres')) {
  url = url.split('?')[0];
}

// Handle SSL for cloud database providers like Neon and Supabase
if (url && (process.env.NODE_ENV === 'production' || url.includes('neon.tech') || url.includes('supabase.co') || url.includes('supabase.com'))) {
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
  console.log('⚠️ Database connection URL is not configured. Falling back to in-memory SQLite database.');
} else {
  options.dialectModule = require('pg');
}

module.exports = {
  url,
  options,
};
