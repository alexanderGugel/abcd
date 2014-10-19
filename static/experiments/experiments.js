'use strict';

angular.module('angularApp.experiments', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/experiments', {
    templateUrl: 'experiments/experiments.html',
    controller: 'ExperimentsCtrl',
    restricted: true
  });
}])

.controller('ExperimentsCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {

}]);
