'use strict';

angular.module('angularApp.support', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/support', {
    templateUrl: 'support/support.html',
    controller: 'supportCtrl',
    restricted: true
  });
}])

.controller('supportCtrl', ['$scope', '$http', '$location', '$rootScope', function ($scope, $http, $location, $rootScope) {
  $scope.createTicket = function (request) {
    $http.post('/api/tickets', {
      problem: request.problem,
      token: localStorage.getItem('token')
    })
    .success(function (data) {
      $scope.success = true;
      $scope.request = {};
    });
  };
}]);
