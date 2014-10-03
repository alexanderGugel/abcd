var after = function after(count, callback) {
  var counter = count;
  return function() {
      counter--;
      if (counter === 0) callback.apply(this, arguments);
  };
};

module.exports = exports = {
  after: after
};
