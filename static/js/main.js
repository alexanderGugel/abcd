window.page = require('page');

// $(function () {
  // if (localStorage.getItem('newbie') && !localStorage.getItem('hide-getting-started')) {
  //   $('#getting-started').show();
  //   $('#getting-started').on('click', '.close', function () {
  //     localStorage.setItem('hide-getting-started', new Date().getTime());
  //     $('#getting-started').hide();
  //   })
  // }

  // page('/', require('./landing'));
  //
  page('/dashboard', require('./dashboard'));
  // page('/dashboard', function () {
  //   debugger;
  // });
  // page('/logout', require('./logout'));

  page('/signup', require('./signup-login'));
  // page('/login', require('./signup-login'));
  page();
// });
