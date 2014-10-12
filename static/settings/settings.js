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
}]);
