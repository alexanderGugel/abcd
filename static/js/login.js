$('#login form').on('submit', function (e) {
  e.preventDefault();
  var email = $('#login input[type=email]').val();
  var password = $('#login input[type=password]').val();
  $.ajax({
    url: '/api/token',
    type: 'POST',
    data: JSON.stringify({
      email: email,
      password: password
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function (response) {
      localStorage.setItem('token', response.token);
      page('/dashboard');
    },
    error: function (response) {
      $('#login .error').text(response.responseJSON.error);
    }
  });
});

module.exports = function (context) {
  if (localStorage.getItem('token') !== null) {
    page('/dashboard');
    return;
  }

  $(function () {
    $('section').hide();
    $('#login').show();
  });
};
