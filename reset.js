var query = require('./query');

query(
  'DROP TABLE IF EXISTS "user" CASCADE;' +

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

  'CREATE TABLE IF NOT EXISTS "experiment" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'user_id BIGSERIAL NOT NULL REFERENCES "user"(id),' +
    'name TEXT NOT NULL,' +
    'running BOOLEAN NOT NULL' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "variant" (' +
    'id BIGSERIAL PRIMARY KEY,' +
    'name TEXT NOT NULL,' +
    'control BOOLEAN NOT NULL,' +
    'experiment_id BIGSERIAL NOT NULL REFERENCES "experiment"(id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "request" (' +
    'id BIGSERIAL PRIMARY KEY,' + // TODO: More columns
    'variant_id BIGSERIAL NOT NULL REFERENCES "variant"(id)' +
  ');'
);
