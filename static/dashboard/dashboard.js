'use strict';

angular.module('angularApp.dashboard', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/dashboard', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'DashboardCtrl',
    restricted: true
  });
}])

.controller('DashboardCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {

}]);
