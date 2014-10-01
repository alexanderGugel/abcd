var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

db.serialize(function() {
  db.run(
    'CREATE TABLE IF NOT EXISTS user (' +
      'userid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,' +
      'useremail TEXT NOT NULL UNIQUE,' +
      'userpassword TEXT NOT NULL' +
    ')'
  );

  db.run(
    'CREATE TABLE IF NOT EXISTS experiment (' +
      'experimentid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,' +
      'experimentcreator INTEGER NOT NULL,' +
      'experimentname TEXT NOT NULL,' +
      'experimentrunning BOOLEAN NOT NULL CHECK (experimentrunning IN (0,1)),' +
      'FOREIGN KEY(experimentcreator) REFERENCES user(userid)' +
    ')'
  );

  db.run(
    'CREATE TABLE IF NOT EXISTS variant (' +
      'variantid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,' +
      'variantname TEXT NOT NULL,' +
      'variantcontrol BOOLEAN NOT NULL CHECK (variantcontrol IN (0,1)),' +
      'variantexperiment INTEGER NOT NULL,' +
      'FOREIGN KEY(variantexperiment) REFERENCES experiment(experimentid)' +
    ')'
  );

  // db.run(
  //   'CREATE TABLE IF NOT EXISTS variant (' +
  //     'variantid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,' +
  //     'variantname TEXT NOT NULL,' +
  //     'variantcontrol BOOLEAN NOT NULL CHECK (variantcontrol IN (0,1)),' +
  //     'FOREIGN KEY(variantexperiment) REFERENCES experiment(experimentid)' +
  //   ')'
  // );





  // var stmt = db.prepare('INSERT INTO lorem VALUES (?)');
  // for (var i = 0; i < 10; i++) {
  //     stmt.run('Ipsum ' + i);
  // }
  // stmt.finalize();
  //
  // db.each('SELECT rowid AS id, info FROM lorem', function(err, row) {
  //     console.log(row.id + ': ' + row.info);
  // });
  // db.close();
});


module.export = exports = db;
