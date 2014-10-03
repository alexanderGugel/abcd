module.exports = function () {
  if (localStorage.getItem('token')) {
    page('/dashboard');
    return;
  }
};
