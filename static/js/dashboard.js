var Mustache = require('mustache');

if (!localStorage.getItem('token')) {
  window.location.href = '/login';
}

var loadExperiments = function () {
  var experimentsTemplate = $('#experiments-template').html();

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
  }];

  $('#experiments tbody').html(Mustache.render(experimentsTemplate, {
    experiments: experiments
  }));
};

loadExperiments();

var loadEndpoint = function () {
  $.ajax({
    url: '/api/endpoint',
    type: 'GET',
    data: {
      token: localStorage.getItem('token')
    },
    dataType: 'json',
    success: function (response) {
      var endpoints = response.endpoints;
      var endpoint = endpoints[0].endpoint;
      $('#endpoint').text(endpoint);
    }
  });
};

loadEndpoint();

$('#experiments tbody').on('click', '.delete button', function () {
  var id = $(this).data('id');
  var confirmation = confirm('Are you sure you want to delete this experiment?');
  if (confirmation) {
    console.log('Delete ' + id);
    loadExperiments();
  }
});
