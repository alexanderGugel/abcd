var query = require('./db/query');

query(
  'DROP TABLE IF EXISTS "users" CASCADE;' +
  'DROP TABLE IF EXISTS "tokens" CASCADE;' +
  'DROP TABLE IF EXISTS "endpoints" CASCADE;' +
  'DROP TABLE IF EXISTS "actions" CASCADE;' +

  'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' +

  'CREATE TABLE IF NOT EXISTS "users" (' +
    'id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),' +
    'email TEXT NOT NULL UNIQUE,' +
    'password TEXT NOT NULL' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "tokens" (' +
    'id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),' +
    'user_id UUID NOT NULL REFERENCES "users"(id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "endpoints" (' +
    'id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),' +
    'is_active BOOLEAN NOT NULL DEFAULT TRUE,' +
    'user_id UUID NOT NULL REFERENCES "users"(id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "actions" (' +
    'id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),' +
    'started_at TIMESTAMP DEFAULT NOW(),' +
    'completed_at TIMESTAMP,' +
    'start_data JSON,' +
    'complete_data JSON,' +
    'variant TEXT NOT NULL,' +
    'experiment TEXT NOT NULL,' +
    'endpoint_id UUID NOT NULL REFERENCES "endpoints"(id)' +
  ');'
);
