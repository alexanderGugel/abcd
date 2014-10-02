$(function () {
  var pathname = window.location.pathname;

  if (localStorage.getItem('newbie') && !localStorage.getItem('hide-getting-started')) {
    $('#getting-started').show();
    $('#getting-started').on('click', '.close', function () {
      localStorage.setItem('hide-getting-started', new Date().getTime());
      $('#getting-started').hide();
    })
  }

  if (pathname === '/') {
    require('./landing');
  } else if (pathname === '/dashboard') {
    require('./dashboard');
  } else if (pathname === '/logout') {
    require('./logout');
  } else if (pathname === '/signup' || pathname === '/login') {
    require('./signup-login');
  }
});
