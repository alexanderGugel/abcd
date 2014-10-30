  var query = require('./db/query');

query(
  'DROP TABLE IF EXISTS "users" CASCADE;' +
  'DROP TABLE IF EXISTS "tokens" CASCADE;' +
  'DROP TABLE IF EXISTS "experiments" CASCADE;' +
  'DROP TABLE IF EXISTS "actions" CASCADE;' +

  'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' +

  'CREATE TABLE IF NOT EXISTS "users" (' +
    'id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),' +
    'email TEXT NOT NULL UNIQUE,' +
    'password TEXT NOT NULL,' +
    'created_at TIMESTAMP DEFAULT NOW()' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "tokens" (' +
    'id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),' +
    'user_id UUID NOT NULL REFERENCES "users"(id),' +
    'created_at TIMESTAMP DEFAULT NOW()' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "experiments" (' +
    'id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),' +
    'name TEXT NOT NULL,' +
    'description TEXT,' +
    'archived BOOLEAN DEFAULT FALSE,' +
    'active BOOLEAN DEFAULT TRUE,' +
    'created_at TIMESTAMP DEFAULT NOW(),' +
    'user_id UUID NOT NULL REFERENCES "users"(id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "collaborators" (' +
    'id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),' +
    'experiment_id UUID NOT NULL REFERENCES "experiments"(id),' +
    'user_id UUID NOT NULL REFERENCES "users"(id),' +
    'UNIQUE (experiment_id, user_id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "actions" (' +
    'id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),' +
    'started_at TIMESTAMP DEFAULT NOW(),' +
    'completed_at TIMESTAMP,' +
    'start_data JSON,' +
    'complete_data JSON,' +
    'variant TEXT NOT NULL,' +
    'experiment_id UUID NOT NULL REFERENCES "experiments"(id)' +
  ');'
);
