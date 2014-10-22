'use strict';

angular.module('angularApp.signup', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/signup', {
    templateUrl: 'signup/signup.html',
    controller: 'SignupCtrl',
    landing: true
  });
}])

.controller('SignupCtrl', ['$scope', '$http', '$location', '$rootScope', function ($scope, $http, $location, $rootScope) {
  $scope.createUser = function (user) {
    $http.post('/api/users', user).
    success(function (data) {
      localStorage.setItem('token', data.token);
      $location.path('/projects/new');
      $rootScope.user = user;
    }).
    error(function (data) {
      $scope.error = data.error;
    });
  };
}]);
