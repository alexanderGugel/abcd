module.exports = function () {
  if (localStorage.getItem('token')) {
    page('/dashboard');
    return;
  }

  $(function () {
    $('section').hide();
    $('#landing').show();
  });
};
