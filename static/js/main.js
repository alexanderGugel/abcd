$(function () {
  var pathname = window.location.pathname;
  if (pathname === '/') {
    if (localStorage.token) {
      window.location.href = '/experiments';
    }
  } else if (pathname === '/logout') {
    localStorage.removeItem('token');
    window.location.href = '/';
  } else if (pathname === '/signup' || pathname === '/login') {
    if (localStorage.token) {
      window.location.href = '/experiments';
    }
    $('form').on('submit', function (e) {
      e.preventDefault();
      var email = $('#email-input').val();
      var password = $('#password-input').val();
      $.ajax({
        url: pathname === '/signup' ? '/api/user' : '/api/token',
        type: 'POST',
        data: JSON.stringify({
          email: email,
          password: password
        }),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (response) {
          localStorage.token = response.token;
          window.location.href = '/experiments';
        },
        error: function (response) {
          $('form #error').text(response.responseJSON.error);
        }
      });
    });
  }
});
