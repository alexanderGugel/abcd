'use strict';

angular.module('angularApp.logout', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/logout', {
    controller: 'LogoutCtrl',
    templateUrl: 'logout/logout.html',
  });
}])

.controller('LogoutCtrl', ['$location', '$rootScope', function ($location, $rootScope) {
  console.log('Logout');
  localStorage.removeItem('token');
  delete $rootScope.user;

  $location.path('/signin');
}]);
