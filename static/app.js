'use strict';

// Declare app level module which depends on views, and components
angular.module('angularApp', [
  'ngRoute',
  'angularApp.signin',
  'angularApp.signup',
  'angularApp.dashboard',
  'angularApp.settings',
  'angularApp.logout'
]).
config(['$routeProvider', function ($routeProvider) {
  $routeProvider.otherwise({
    redirectTo: '/signin'
  });
}]);
