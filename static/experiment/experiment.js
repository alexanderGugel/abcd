'use strict';

angular.module('angularApp.experiment', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/experiments/:id', {
    templateUrl: 'experiment/experiment.html',
    controller: 'ExperimentCtrl',
    restricted: true
  });
}])

.directive('summary', [function () {
  return {
    restrict: 'E',
    templateUrl: 'experiment/summary.html'
  };
}])

.directive('description', [function () {
  return {
    restrict: 'E',
    templateUrl: 'experiment/description.html'
  };
}])

.directive('setup', [function () {
  return {
    restrict: 'E',
    templateUrl: 'experiment/setup.html'
  };
}])

.directive('actions', [function () {
  return {
    restrict: 'E',
    templateUrl: 'experiment/actions.html'
  };
}])

.directive('debugger', [function () {
  return {
    restrict: 'E',
    templateUrl: 'experiment/debugger.html'
  };
}])

.directive('results', [function () {
  return {
    restrict: 'E',
    templateUrl: 'experiment/results.html'
  };
}])

.directive('export', [function () {
  return {
    restrict: 'E',
    templateUrl: 'experiment/export.html'
  };
}])

.filter('offset', function() {
  return function(input, start) {
    start = parseInt(start, 10);
    return input.slice(start);
  };
})

.controller('ActionsCtrl', ['$scope', function ($scope) {

  $scope.actionsPerPage = 50;
  $scope.actionsCurrentPage = 0;

  $scope.actionsPageCount = function () {
    return Math.ceil($scope.actions.length/$scope.actionsPerPage)-1;
  };
}])

.controller('ExperimentCtrl', ['$scope', '$http', '$location', '$routeParams', '$rootScope', function ($scope, $http, $location, $routeParams, $rootScope) {
  var experimentId = $routeParams.id;

  $scope.show = 'results';

  var socket = io();

  socket.emit('debug', {
    experimentId: experimentId,
    token: localStorage.getItem('token')
  });

  $scope.debugger = [];

  $scope.fetchActions = function (experimentId) {
    return $http({
      url: '/api/experiments/' + experimentId + '/actions',
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
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

  $scope.resetExperiment = function (experiment) {
    var confirmation = confirm('Are you sure you want to reset this experiment? This will delete all associated actions and conversions.');
    if (!confirmation) return;
    return $http({
      url: '/api/experiments/' + experiment.id + '/actions',
      method: 'DELETE',
      params: {
        token: localStorage.getItem('token')
      }
    }).success(function () {
      $scope.fetchActions(experiment.id);
    });
  };

  $scope.deleteExperiment = function (experiment) {
    var confirmation = confirm('Are you sure you want to delete this experiment and all results?');
    if (!confirmation) return;
    return $http({
      url: '/api/experiments/' + experiment.id,
      method: 'DELETE',
      params: {
        token: localStorage.getItem('token')
      }
    }).success(function () {
      $location.path('/');
    });
  };

  $scope.fetchExperiment(experimentId);
  $scope.fetchActions(experimentId).then(function () {
    socket.on('action', function (action) {
      $scope.debugger.push(action);

      if (!action.completed_at) {
        $scope.actions.push(action);
      } else {
        var oldAction = _.where($scope.actions, {
          id: action.id
        })[0];

        _.assign(oldAction, action);
      }
      $scope.$apply('actions');
    });
  });
}]);
