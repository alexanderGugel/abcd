var query = require('./db/query');

query(
  'INSERT INTO "actions" (completed_at, variant, experiment_id) ' +
    'SELECT ' +
      'NOW() - \'1 minute\'::INTERVAL * ROUND(RANDOM() * 100), ' +
      'ROUND(RANDOM()*4 + 1), ' +
      '(SELECT id FROM experiments ORDER BY random() LIMIT 1) ' +
      'FROM generate_series(1,10000) AS x(id)'
);
