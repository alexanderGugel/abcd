'use strict';

angular.module('angularApp.usage', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/usage', {
    templateUrl: 'usage/usage.html',
    controller: 'UsageCtrl',
    restricted: true
  });
}])

.directive('usage', [function () {
  var chart;

  var link = function (scope, element, attrs) {
    chart = c3.generate({
      bindTo: element[0]
    });

    scope.$watch('usage', function () {
      var days = _.map(scope.usage, function (datum) {
        return datum.day;
      });
      console.log(days);
    });
  };


  return {
    link: link,
    restrict: 'E'
  };
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
    $scope.usage = data;
  });
}]);
