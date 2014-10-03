window.page = require('page');

  // if (localStorage.getItem('newbie') && !localStorage.getItem('hide-getting-started')) {
  //   $('#getting-started').show();
  //   $('#getting-started').on('click', '.close', function () {
  //     localStorage.setItem('hide-getting-started', new Date().getTime());
  //     $('#getting-started').hide();
  //   })
  // }


// Not available to logged in users
page('/', require('./landing'));
page('/signup', require('./signup'));
page('/login', require('./login'));
page('/docs', require('./docs'));

// Only for logged in users
page('/dashboard', require('./dashboard'));
page('/logout', require('./logout'));
page('/settings', require('./settings'))
page();
