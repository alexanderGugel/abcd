'use strict';

angular.module('angularApp.experiments', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/experiments', {
    templateUrl: 'experiments/experiments.html',
    controller: 'ExperimentsCtrl',
    restricted: true
  });
}])

.controller('ExperimentsCtrl', ['$scope', '$http', '$location', '$routeParams', function ($scope, $http, $location, $routeParams) {
  $scope.predicate = 'created_at';

  $scope.updateExperiment = function (experiment) {
    return $http({
      url: '/api/experiments/' + experiment.id,
      method: 'PUT',
      data: experiment,
      params: {
        token: localStorage.getItem('token')
      }
    });
  };

  $scope.createExperiment = function (experiment) {
    $http.post('/api/experiments', {
      name: experiment.name,
      token: localStorage.getItem('token')
    })
    .success(function (data) {
      experiment.name = undefined;
      $scope.fetchExperiments();
    });
  };

  $scope.fetchExperiments = function () {
    $http({
      url: '/api/experiments',
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      $scope.experiments = data;
    });
  };

  $scope.fetchExperiments();
}]);
