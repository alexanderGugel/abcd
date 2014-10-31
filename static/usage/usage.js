'use strict';

angular.module('angularApp.usage', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/usage', {
    templateUrl: 'usage/usage.html',
    controller: 'UsageCtrl',
    restricted: true
  });
}])

.controller('UsageCtrl', ['$scope', '$http', '$location', '$routeParams', function ($scope, $http, $location, $routeParams) {
  $http({
    url: '/api/usage',
    method: 'GET',
    params: {
      token: localStorage.getItem('token')
    }
  })
  .success(function (data) {
    $scope.usage = _.map(data, function (datum) {
      datum.day = new Date(datum.day);
      return datum;
    });

    $scope.options = {
      axes: {
        x: {
          key: 'day',
          type: 'date'
        },
        y: {
          type: 'linear',
          ticks: 1,
          min: 0
        }
      },
      series: [
        {
          y: 'actions',
          color: '#ccc',
          thickness: '3px',
          type: 'area',
          dotSize: 5
        }
      ]
      // lineMode: 'linear',
      // tension: 0.7,
      // tooltip: {mode: 'scrubber', formatter: function(x, y, series) {return 'pouet';}},
      // drawLegend: true,
      // drawDots: true,
      // columnsHGap: 5
    };
  });
}]);
