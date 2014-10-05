var Mustache = require('mustache');

var loadExperiments = function () {
  var endpointsTemplate = $('#endpoints-template').html();
  //
  // var experiments = [{
  //   name: 'test',
  //   id: 1,
  //   actions: 155,
  //   visitors: 1050,
  //   running: true
  // },{
  //   name: 'test',
  //   id: 1,
  //   actions: 155,
  //   visitors: 1050,
  //   running: true
  // },{
  //   name: 'test',
  //   id: 1,
  //   actions: 155,
  //   visitors: 1050,
  //   running: true
  // },{
  //   name: 'test',
  //   id: 1,
  //   actions: 155,
  //   visitors: 1050,
  //   running: false
  // }];
  //
  // $('.experiments tbody').html(Mustache.render(experimentsTemplate, {
  //   experiments: experiments
  // }));


  $.ajax({
    url: '/api/experiment',
    type: 'GET',
    data: {
      token: localStorage.getItem('token')
    },
    dataType: 'json',
    success: function (experimentResponse) {

      $.ajax({
        url: '/api/endpoint',
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

          $('#dashboard .endpoints').html(Mustache.render(endpointsTemplate, {
            endpoints: endpoints
          }));
        }
      });
    }
  });
};

var createEndpoint = function () {
  $.ajax({
    url: '/api/endpoint',
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
    url: '/api/endpoint',
    type: 'DELETE',
    data: JSON.stringify({
      token: localStorage.getItem('token'),
      endpoint: endpoint
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function () {
      loadExperiments();
    }
  });
};



// var loadEndpoints = function () {
//   $.ajax({
//     url: '/api/endpoint',
//     type: 'GET',
//     data: {
//       token: localStorage.getItem('token')
//     },
//     dataType: 'json',
//     success: function (response) {
//       var endpoints = response.endpoints;
//       var endpoint = endpoints[0].endpoint;
//       $('#endpoint').text(endpoint);
//     }
//   });
// };

$('#dashboard').on('click', '.experiments .delete button', function () {
  var id = $(this).closest('.experiment').data('id');
  var confirmation = confirm('Are you sure you want to delete this experiment?');
  if (confirmation) {
    loadExperiments();
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
    // loadEndpoints();
  });
};
