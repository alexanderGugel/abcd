'use strict';

// Declare app level module which depends on views, and components
angular.module('angularApp', [
  'ngRoute',
  'angularApp.signin',
  'angularApp.signup',
  'angularApp.dashboard',
  'angularApp.settings',
  'angularApp.logout',
  'angularApp.drop'
])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.otherwise({
    redirectTo: '/signin'
  });
}])

.run(['$http', '$rootScope', function ($http, $rootScope) {
  if (localStorage.getItem('token')) {
    $http({
      url: '/api/users/me',
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      if (data.error) {
        localStorage.removeItem('token')
        $routeProvider.otherwise({
          redirectTo: '/signin'
        });
      } else {
        $rootScope.user = data.user;
      }
    });
  }
}]);
