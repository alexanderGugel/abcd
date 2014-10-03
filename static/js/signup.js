module.exports = function (context) {
  $(function () {
    $('section').hide();
    $('#signup').show();
  });

  if (localStorage.getItem('token') !== null) {
    page('/dashboard');
    return;
  }

  $('#signup form').on('submit', function (e) {
    e.preventDefault();
    var email = $('#signup inpu[type=email]').val();
    var password = $('#signup inpu[type=password]').val();
    $.ajax({
      url: '/api/user',
      type: 'POST',
      data: JSON.stringify({
        email: email,
        password: password
      }),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      success: function (response) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('newbie', new Date().getTime());
        page('/dashboard');
      },
      error: function (response) {
        $('#signup .error').text(response.responseJSON.error);
      }
    });
  });
};
