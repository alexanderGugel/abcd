'use strict';

angular.module('angularApp.logout', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/logout', {
    controller: 'LogoutCtrl',
    templateUrl: 'logout/logout.html',
  });
}])

.controller('LogoutCtrl', ['$location', function ($location) {
  console.log('Logout');
  localStorage.removeItem('token');
  $location.path('/login');
}]);
