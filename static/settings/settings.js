'use strict';

angular.module('angularApp.settings', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/settings', {
    templateUrl: 'settings/settings.html',
    controller: 'SettingsCtrl'
  });
}])

.controller('SettingsCtrl', ['$scope', '$http', '$location', function ($scope, $http) {
  if (localStorage.getItem('token') === null) {
    $location.path('/');
    return;
  }

  $scope.autoPopulate = function () {
    $http({
      url: '/api/users/me',
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      $scope.user = data.user;
    });
  };

  $scope.autoPopulate();

  $scope.updateUser = function (user) {
    $http({
      method: 'PATCH',
      url: '/api/users/me',
      data: user,
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      $scope.autoPopulate();
    })
    .error(function (data) {
      $scope.error = data.error;
    });
  };
}]);
