module.exports = function () {
  $(function () {
    $('section').hide();
    $('#landing').show();
  });

  if (localStorage.getItem('token')) {
    page('/dashboard');
    return;
  }
};
