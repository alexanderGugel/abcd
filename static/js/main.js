$(function () {
  var pathname = window.location.pathname;
  if (pathname === '/') {
    require('./landing');
  } else if (pathname === '/experiments') {
    require('./experiments');
  } else if (pathname === '/logout') {
    require('./logout');
  } else if (pathname === '/signup' || pathname === '/login') {
    require('./signup-login');
  }
});
