'use strict';

// Declare app level module which depends on views, and components
angular.module('angularApp', [
  'ngRoute',
  'angularApp.login',
  'angularApp.signup',
  'angularApp.dashboard',
  'angularApp.settings',
  'angularApp.logout'
]).
config(['$routeProvider', function ($routeProvider) {
  $routeProvider.otherwise({
    redirectTo: '/login'
  });
}]);
