'use strict';

angular.module('angularApp.dashboard', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/dashboard', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'DashboardCtrl'
  });
}])

.controller('DashboardCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
  if (localStorage.getItem('token') === null) {
    $location.path('/');
    return;
  }

  $scope.addEndpoint = function () {
    $http.post('/api/endpoints', {
      token: localStorage.getItem('token')
    })
    .success(function (data) {
      console.log(data);
      $scope.refresh();
    });
  };

  $scope.refresh = function () {
    $http({
      url: '/api/endpoints',
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      $scope.endpoints = data.endpoints;
    });
  };

  $scope.deleteEndpoint = function (endpoint) {
    $http({
      url: '/api/endpoints/' + endpoint.id,
      method: 'DELETE',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      $scope.refresh();
    });
  };

  $scope.refresh();
}]);
