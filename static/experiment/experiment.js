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
  $scope.fetchActions = function (experimentId) {
    return $http({
      url: '/api/experiments/' + experimentId + '/actions',
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      // experiment.actions = crossfilter(data);
      $scope.actions = data;
    });
  };

  $scope.fetchExperiment = function (experimentId) {
    return $http({
      url: '/api/experiments/' + experimentId,
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      $scope.experiment = $rootScope.experiment = data;
    });
  };

  $scope.updateExperiment = function (experiment) {
    experiment.name = experiment.name || experiment.originalName;
    return $http({
      url: '/api/experiments/' + experiment.id,
      method: 'PUT',
      data: experiment,
      params: {
        token: localStorage.getItem('token')
      }
    });
  };

  $scope.filterActions = function (actions) {

  };

  $scope.summarizeActions = function () {
    $scope.summary = _.reduce($scope.actions, function (summary, action) {
      // debugger;
      summary.variants[action.variant] = summary.variants[action.variant] || {
        actions: 0,
        conversions: 0
      };
      summary.variants[action.variant].actions++;
      if (action.completed_at) {
        summary.variants[action.variant].conversions++;
      }
      return summary;
    }, {
      variants: {
      }
    });
    $scope.summary
  };

  // $scope.filterBetween = function (startDate, endDate) {
  //   experiment.actionsByStartedAt.filterRange([startDate, endDate]);
  // };
  //
  // $scope.resetFilters = function () {
  //   dimension.filterAll()
  // };

  $scope.fetchExperiment($routeParams.id);
  $scope.fetchActions($routeParams.id).then(function () {
    if ($scope.actions.length > 0) {
      $scope.startDate = new Date($scope.actions[0].started_at);
      $scope.endDate = new Date($scope.actions[$scope.actions.length - 1].started_at);
    }

    $scope.summarizeActions();

    // var experiment = $scope.experiment;
    //
    // experiment.actionsByStartedAt = experiment.actions.dimension(function (action) {
    //   return Date.parse(action['started_at']);
    // });
    //
    // var latestAction = experiment.actionsByStartedAt.top(1)[0];
    // var oldestAction = experiment.actionsByStartedAt.bottom(1)[0];
    //
    // var age = Date.parse(latestAction['started_at']) - Date.parse(oldestAction['started_at']);
    //
    // experiment.actionGroupsByStartedAt = experiment.actionsByStartedAt.group(function (startedAt) {
    //   // var d = Date.parse(startedAt);
    //   // Math.random() > 0.9 && console.log(d);
    //   // d = Math.round((d/60));
    //   return Math.round(startedAt/60);
    // });
    //
    // var t = experiment.actionGroupsByStartedAt;
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
