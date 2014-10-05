var Hogan = require('hogan.js');

var endpointsTemplate;

var loadExperiments = function () {
  if (!endpointsTemplate) {
    endpointsTemplate = $('#endpoints-template').html();
    endpointsTemplate = Hogan.compile(endpointsTemplate);
  }

  $.ajax({
    url: '/api/experiments',
    type: 'GET',
    data: {
      token: localStorage.getItem('token')
    },
    dataType: 'json',
    success: function (experimentResponse) {

      $.ajax({
        url: '/api/endpoints',
        type: 'GET',
        data: {
          token: localStorage.getItem('token')
        },
        dataType: 'json',
        success: function (endpointResponse) {
          var experiments = experimentResponse.experiments;
          var endpoints = endpointResponse.endpoints;
          var sortedExperiments = {};

          for (var i = 0; i < endpoints.length; i++) {
            sortedExperiments[endpoints[i].endpoint] = [];
          }

          for (var i = 0; i < experiments.length; i++) {
            sortedExperiments[experiments[i].endpoint].push(experiments[i]);
          }

          endpoints = [];
          for (var endpoint in sortedExperiments) {
            endpoints.push({
              endpoint: endpoint,
              experiments: sortedExperiments[endpoint]
            });
          }

          $('#dashboard .endpoints').html(endpointsTemplate.render({
            endpoints: endpoints || []
          }));
        }
      });
    }
  });
};

var createEndpoint = function () {
  $.ajax({
    url: '/api/endpoints',
    type: 'POST',
    data: JSON.stringify({
      token: localStorage.getItem('token')
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function () {
      loadExperiments();
    }
  });
};

var deleteEndpoint = function (endpoint) {
  $.ajax({
    url: '/api/endpoints/' + endpoint,
    type: 'DELETE',
    data: JSON.stringify({
      token: localStorage.getItem('token')
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function () {
      loadExperiments();
    }
  });
};

var deleteExperiment = function (id) {
  $.ajax({
    url: '/api/experiments/' + id,
    type: 'DELETE',
    data: JSON.stringify({
      token: localStorage.getItem('token')
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function () {
      loadExperiments();
    }
  });
};

$('#dashboard .experiments').on('click', '.delete-experiment', function () {
  var id = $(this).closest('.experiment').data('id');
  var confirmation = confirm('Are you sure you want to delete this experiment?');
  if (confirmation) {
    deleteExperiment(id);
  }
});

$('#dashboard .create-endpoint').on('click', function (e) {
  e.preventDefault();
  createEndpoint();
});

$('#dashboard .endpoints').on('click', '.delete-endpoint', function () {
  var endpoint = $(this).closest('.endpoint').data('endpoint');
  var confirmation = confirm('Are you sure you want to delete this endpoint and all its experiments?');
  if (confirmation) {
    deleteEndpoint(endpoint);
  }
});

module.exports = function () {
  if (localStorage.getItem('token') === null) {
    page('/login');
    return;
  }

  $(function () {
    $('section').hide();
    $('#dashboard').show();
    loadExperiments();
  });
};
