'use strict';

angular.module('angularApp.experiments', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/experiments/:id?', {
    templateUrl: 'experiments/experiments.html',
    controller: 'ExperimentsCtrl',
    restricted: true
  });
}])

.controller('ExperimentsCtrl', ['$scope', '$http', '$location', '$routeParams', function ($scope, $http, $location, $routeParams) {
  $scope.new = $routeParams.id === 'new';

  $scope.createExperiment = function (name) {
    $http.post('/api/experiments', {
      name: name,
      token: localStorage.getItem('token')
    })
    .success(function (data) {
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
      $scope.experiments = data.experiments;
    });
  };

  $scope.updateExperiment = function (experiment) {
    $http({
      url: '/api/experiments/' + experiment.id,
      method: 'PUT',
      data: experiment,
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      // $scope.fetchExperiments();
    });
  };



  $scope.fetchExperiments();
  $scope.createExperiment('Test');

}]);
