'use strict';

// Declare app level module which depends on views, and components
angular.module('angularApp', [
  'ngRoute',
  'angularApp.signin',
  'angularApp.signup',
  'angularApp.settings',
  'angularApp.logout',
  'angularApp.toolbar',
  'angularApp.experiments',
  'angularApp.experiment'
])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.otherwise({
    redirectTo: '/signin'
  });
}])

.run(['$http', '$rootScope', '$location', function ($http, $rootScope, $location) {
  if (localStorage.getItem('token') !== null) {
    $rootScope.user = {};
    $http({
      url: '/api/users/me',
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      $rootScope.user = data.user;
    })
    .error(function (data) {
      delete $rootScope.user;
      localStorage.removeItem('token');
      $location.path('/');
    });
  }

  $rootScope.$on('$routeChangeStart', function (event, next) {
    $rootScope.experiment = null;
    if (next.restricted && !$rootScope.user) {
      $location.path('/signin');
    } else if (next.landing && $rootScope.user) {
      $location.path('/experiments');
    }
  });
}]);
