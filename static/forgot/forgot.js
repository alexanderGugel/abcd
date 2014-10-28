'use strict';

angular.module('angularApp.forgot', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/forgot', {
    templateUrl: 'forgot/forgot.html',
    controller: 'ForgotCtrl',
    landing: true
  });
}])

.controller('ForgotCtrl', ['$scope', '$http', '$location', '$rootScope', function ($scope, $http, $location, $rootScope) {
  $scope.sendToken = function (user) {
    $http.put('/api/tokens', user).
    success(function (data) {
      alert('Awesome. We just sent you a link.');
    }).
    error(function (data) {
      $scope.error = data.error;
    });
  };
}]);
