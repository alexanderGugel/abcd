var query = require('./query');

query(
  'DROP TABLE IF EXISTS "user" CASCADE;' +
  'DROP TABLE IF EXISTS "token" CASCADE;' +
  'DROP TABLE IF EXISTS "endpoint" CASCADE;' +
  'DROP TABLE IF EXISTS "experiment" CASCADE;' +
  'DROP TABLE IF EXISTS "variant" CASCADE;' +
  'DROP TABLE IF EXISTS "action" CASCADE;' +

  'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' +

  'CREATE TABLE IF NOT EXISTS "user" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'email TEXT NOT NULL UNIQUE,' +
    'password TEXT NOT NULL' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "token" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'token UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),' +
    'user_id BIGSERIAL NOT NULL REFERENCES "user"(id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "endpoint" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'endpoint UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),' +
    'is_deleted BOOLEAN NOT NULL DEFAULT FALSE,' +
    'user_id BIGSERIAL NOT NULL REFERENCES "user"(id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "experiment" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'endpoint_id BIGSERIAL NOT NULL REFERENCES "endpoint"(id),' +
    'name TEXT NOT NULL,' +
    'running BOOLEAN NOT NULL DEFAULT TRUE,' +
    'is_deleted BOOLEAN NOT NULL DEFAULT FALSE,' +
    'UNIQUE (endpoint_id, name)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "variant" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'name TEXT NOT NULL,' +
    'experiment_id BIGSERIAL NOT NULL REFERENCES "experiment"(id),' +
    'UNIQUE (name, experiment_id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "action" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'started_at TIMESTAMP DEFAULT NOW(),' +
    'completed_at TIMESTAMP,' +
    'start_data JSON,' +
    'complete_data JSON,' +
    'variant_id BIGSERIAL NOT NULL REFERENCES "variant"(id)' +
  ');'
);
