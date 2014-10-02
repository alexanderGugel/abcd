var signup = window.location.pathname === '/signup';

if (localStorage.getItem('token')) {
  window.location.href = '/dashboard';
}

$('form').on('submit', function (e) {
  e.preventDefault();
  var email = $('#email-input').val();
  var password = $('#password-input').val();
  $.ajax({
    url: signup ? '/api/user' : '/api/token',
    type: 'POST',
    data: JSON.stringify({
      email: email,
      password: password
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function (response) {
      localStorage.setItem('token', response.token);
      if (signup) {
        localStorage.setItem('newbie', new Date().getTime());
      }
      window.location.href = '/dashboard';
    },
    error: function (response) {
      $('form #error').text(response.responseJSON.error);
    }
  });
});
