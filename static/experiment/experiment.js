'use strict';

angular.module('angularApp.experiment', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/experiments/:id', {
    templateUrl: 'experiment/experiment.html',
    controller: 'ExperimentCtrl',
    restricted: true
  });
}])

.controller('ExperimentCtrl', ['$scope', '$http', '$location', '$routeParams', function ($scope, $http, $location, $routeParams) {
  $scope.fetchActions = function (experiment) {
    $http({
      url: '/api/experiments/' + experiment.id + '/actions',
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      experiment.actions = data;
    });
  };

  $scope.fetchExperiment = function (experiment) {
    return $http({
      url: '/api/experiments/' + experiment.id,
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      for (var key in data) {
        experiment[key] = data[key];
      }
    });
  };

  $scope.experiment = {
    id: $routeParams.id
  };

  $scope.fetchExperiment($scope.experiment);
  $scope.fetchActions($scope.experiment);
}]);
