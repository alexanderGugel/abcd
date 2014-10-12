'use strict';

angular.module('angularApp.login', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/login', {
    templateUrl: 'login/login.html',
    controller: 'LoginCtrl'
  });
}])

.controller('LoginCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
  if (localStorage.getItem('token') !== null) {
    $location.path('/dashboard');
    return;
  }

  $scope.createToken = function (user) {
    $http.post('/api/tokens', user).
    success(function (data) {
      localStorage.setItem('token', data.token);
      $location.path('/dashboard');
    }).
    error(function (data) {
      $scope.error = data.error;
    });
  };
}]);
