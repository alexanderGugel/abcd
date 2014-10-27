'use strict';

angular.module('angularApp.experiment', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/experiments/:id', {
    templateUrl: 'experiment/experiment.html',
    controller: 'ExperimentCtrl',
    restricted: true
  });
}])

.controller('ExperimentCtrl', ['$scope', '$http', '$location', '$routeParams', '$rootScope', function ($scope, $http, $location, $routeParams, $rootScope) {
  $scope.fetchActions = function (experiment) {
    return $http({
      url: '/api/experiments/' + experiment.id + '/actions',
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      experiment.actions = crossfilter(data);
      // experiment.actions = data;

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

  $scope.filterBetween = function (startDate, endDate) {
    experiment.actionsByStartedAt.filterRange([startDate, endDate]);
  };

  $scope.resetFilters = function () {
    dimension.filterAll()
  };

  $scope.experiment = {
    id: $routeParams.id
  };

  $scope.fetchExperiment($scope.experiment);
  $scope.fetchActions($scope.experiment).then(function () {
    var experiment = $scope.experiment;

    experiment.actionsByStartedAt = experiment.actions.dimension(function (action) {
      return Date.parse(action['started_at']);
    });

    var latestAction = experiment.actionsByStartedAt.top(1)[0];
    var oldestAction = experiment.actionsByStartedAt.bottom(1)[0];

    var age = Date.parse(latestAction['started_at']) - Date.parse(oldestAction['started_at']);

    experiment.actionGroupsByStartedAt = experiment.actionsByStartedAt.group(function (startedAt) {
      // var d = Date.parse(startedAt);
      // Math.random() > 0.9 && console.log(d);
      // d = Math.round((d/60));
      return Math.round(startedAt/60);
    });

    var t = experiment.actionGroupsByStartedAt;
    // console.log(t.all());
    // debugger;

    // debugger;

    // var dates = experiment.actionsByStartedAt.group(d3.time.day);
    // experiment.actionGroupsByStartedAt = experiment.actionsByStartedAt.group(function (startedAt) {
    //
    // });
  });

  $rootScope.experiment = $scope.experiment;
}]);
