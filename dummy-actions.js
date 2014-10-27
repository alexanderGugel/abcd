var query = require('./db/query');

query(
  'INSERT INTO "actions" (started_at, completed_at, variant, experiment_id) ' +
    'SELECT ' +
      'NOW() - \'1 minute\'::INTERVAL * ROUND(RANDOM() * 100), ' +
      'NOW() - \'1 minute\'::INTERVAL * ROUND(RANDOM() * 100), ' +
      'ROUND(RANDOM()*4 + 1), ' +
      '(SELECT id FROM experiments ORDER BY created_at DESC LIMIT 1) ' +
      'FROM generate_series(1,10000) AS x(id)'
);
