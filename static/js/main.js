var Mustache = require('mustache');

$(function () {
  var pathname = window.location.pathname;
  if (pathname === '/') {
    if (localStorage.token) {
      window.location.href = '/experiments';
    }
  } else if (pathname === '/experiments') {
    if (!localStorage.token) {
      window.location.href = '/login';
    }
    var experiments = [{
      name: 'test',
      id: 1,
      actions: 155,
      visitors: 1050,
      running: true
    },{
      name: 'test',
      id: 1,
      actions: 155,
      visitors: 1050,
      running: true
    },{
      name: 'test',
      id: 1,
      actions: 155,
      visitors: 1050,
      running: true
    },{
      name: 'test',
      id: 1,
      actions: 155,
      visitors: 1050,
      running: false
    }]
    var template = $('#experiments-template').html();
    $('#experiments tbody').html(Mustache.render(template, {
      experiments: experiments
    }));
    $('#experiments tbody').on('click', '.delete button', function () {
      var id = $(this).data('id');
      var confirmation = confirm('Are you sure you want to delete this experiment?');
      if (confirmation) {
        console.log('Delete ' + id);
      }
    });
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
