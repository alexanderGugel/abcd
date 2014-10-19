'use strict';

angular.module('angularApp.signin', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/signin', {
    templateUrl: 'signin/signin.html',
    controller: 'signinCtrl'
  });
}])

.controller('signinCtrl', ['$scope', '$http', '$location', '$rootScope', function ($scope, $http, $location, $rootScope) {
  if (localStorage.getItem('token') !== null) {
    $location.path('/dashboard');
    return;
  }

  $scope.createToken = function (user) {
    $http.post('/api/tokens', user)
    .success(function (data) {
      localStorage.setItem('token', data.token);
      $location.path('/dashboard');
      $rootScope.user = user;
    })
    .error(function (data) {
      $scope.error = data.error;
    });
  };
}]);
