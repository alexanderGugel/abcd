'use strict';

// Declare app level module which depends on views, and components
angular.module('angularApp', [
  'ngRoute',
  'n3-line-chart',
  'angularMoment',
  'angularApp.signin',
  'angularApp.signup',
  'angularApp.forgot',
  'angularApp.settings',
  'angularApp.usage',
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

.constant('angularMomentConfig', {})

.run(['$http', '$rootScope', '$location', '$routeParams', function ($http, $rootScope, $location, $routeParams) {
  if ($location.search().token) {
    localStorage.setItem('token', $location.search().token);
  }

  $rootScope.token = localStorage.getItem('token');

  if ($rootScope.token !== null) {
    $rootScope.user = {};
    $http({
      url: '/api/users/me',
      method: 'GET',
      params: {
        token: $rootScope.token
      }
    })
    .success(function (data) {
      $rootScope.user = data.user;
    })
    .error(function (data) {
      debugger;
      delete $rootScope.user;
      delete $rootScope.token;
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
