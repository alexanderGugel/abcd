var query = require('./query');

query(
  'DROP TABLE IF EXISTS "user" CASCADE;' +

  'CREATE TABLE IF NOT EXISTS "user" (' +
    'id BIGSERIAL PRIMARY KEY NOT NULL,' +
    'email TEXT NOT NULL UNIQUE,' +
    'password TEXT NOT NULL' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "experiment" (' +
    'id BIGSERIAL PRIMARY KEY NOT NULL,' +
    'user_id BIGSERIAL NOT NULL REFERENCES "user"(id),' +
    'name TEXT NOT NULL,' +
    'running BOOLEAN NOT NULL' +
  ');' +

  'CREATE TABLE IF NOT EXISTS "variant" (' +
    'id BIGSERIAL PRIMARY KEY NOT NULL,' +
    'name TEXT NOT NULL,' +
    'control BOOLEAN NOT NULL,' +
    'experiment_id BIGSERIAL NOT NULL REFERENCES "experiment"(id)' +
  ');'
);

//
// query(
//   'CREATE TABLE IF NOT EXISTS variant (' +
//     'variantid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,' +
//     'variantname TEXT NOT NULL,' +
//     'variantcontrol BOOLEAN NOT NULL CHECK (variantcontrol IN (0,1)),' +
//     'variantexperiment INTEGER NOT NULL,' +
//     'FOREIGN KEY(variantexperiment) REFERENCES experiment(experimentid)' +
//   ')',
//   function () {
//     console.log(arguments);
//   }
// );
