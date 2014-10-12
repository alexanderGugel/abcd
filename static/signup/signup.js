'use strict';

angular.module('angularApp.signup', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/signup', {
    templateUrl: 'signup/signup.html',
    controller: 'SignupCtrl'
  });
}])

.controller('SignupCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
  if (localStorage.getItem('token') !== null) {
    $location.path('/dashboard');
    return;
  }

  $scope.createUser = function (user) {
    $http.post('/api/users', user).
    success(function (data) {
      localStorage.setItem('token', data.token);
      $location.path('/dashboard');
    }).
    error(function (data) {
      $scope.error = data.error;
    });
  };
}]);
