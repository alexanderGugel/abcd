var query = require('./db/query');

query(
  'DROP TABLE IF EXISTS "users" CASCADE;' +
  'DROP TABLE IF EXISTS "tokens" CASCADE;' +
  'DROP TABLE IF EXISTS "endpoints" CASCADE;' +
  'DROP TABLE IF EXISTS "experiments" CASCADE;' +
  'DROP TABLE IF EXISTS "variants" CASCADE;' +
  'DROP TABLE IF EXISTS "actions" CASCADE;' +

  'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' +

  'CREATE TABLE IF NOT EXISTS "users" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'email TEXT NOT NULL UNIQUE,' +
    'password TEXT NOT NULL' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "tokens" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'token UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),' +
    'user_id BIGSERIAL NOT NULL REFERENCES "users"(id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "endpoints" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'endpoint UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),' +
    'is_deleted BOOLEAN NOT NULL DEFAULT FALSE,' +
    'user_id BIGSERIAL NOT NULL REFERENCES "users"(id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "experiments" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'endpoint_id BIGSERIAL NOT NULL REFERENCES "endpoints"(id),' +
    'name TEXT NOT NULL,' +
    'running BOOLEAN NOT NULL DEFAULT TRUE,' +
    'is_deleted BOOLEAN NOT NULL DEFAULT FALSE,' +
    'UNIQUE (endpoint_id, name)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "variants" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'name TEXT NOT NULL,' +
    'experiment_id BIGSERIAL NOT NULL REFERENCES "experiments"(id),' +
    'UNIQUE (name, experiment_id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "actions" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'started_at TIMESTAMP DEFAULT NOW(),' +
    'completed_at TIMESTAMP,' +
    'start_data JSON,' +
    'complete_data JSON,' +
    'variant_id BIGSERIAL NOT NULL REFERENCES "variants"(id)' +
  ');'
);
