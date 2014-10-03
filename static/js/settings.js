var loadUser = function () {
  $.ajax({
    url: '/api/user/me',
    type: 'GET',
    data: {
      token: localStorage.getItem('token')
    },
    dataType: 'json',
    success: function (response) {
      $('#update-account input[type=email]').val(response.user.email);
    }
  });
};

module.exports = function (context) {
  $(function () {
    $('section').hide();
    $('#settings').show();
    loadUser();
  });

  if (localStorage.getItem('token') === null) {
    page('/login');
    return;
  }

  $('#update-account').on('submit', function (e) {
    e.preventDefault();

    var newEmail = $('#update-account input[type=email]').val();
    var newPassword = $('#update-account input[type=password]').val();

    $.ajax({
      url: '/api/user/me',
      type: 'PUT',
      data: JSON.stringify({
        token: localStorage.getItem('token'),
        newEmail: newEmail,
        newPassword: newPassword
      }),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      success: function (response) {
        $('#message').stop(true);
        $('#message').addClass('success');
        $('#message').text('Successfully changed account information');
        $('#message').slideDown().delay(1000).slideUp();
        $('#update-account input[type=password]').val('')
      },
      error: function (response) {
        $('#message').stop(true);
        $('#message').removeClass('success');
        $('#message').addClass('error');
        $('#message').text(response.responseJSON.error);
        $('#message').slideDown().delay(1000).slideUp();
        $('#update-account input[type=password]').val('')
      }
    });
  });
};
