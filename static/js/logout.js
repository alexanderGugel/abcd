module.exports = function () {
  localStorage.removeItem('token');
  page('/');
};
