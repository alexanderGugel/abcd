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
    'deleted BOOLEAN DEFAULT FALSE,' +
    'user_id UUID NOT NULL REFERENCES "users"(id)' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "actions" (' +
    'id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),' +
    'ip inet,' +
    'user_agent TEXT,' +
    'user_agent_parsed JSON,' +
    'started_at TIMESTAMP DEFAULT NOW(),' +
    'completed_at TIMESTAMP,' +
    'variant TEXT NOT NULL,' +
    'deleted BOOLEAN DEFAULT FALSE,' +
    'experiment_id UUID NOT NULL REFERENCES "experiments"(id)' +
  ');'
);
