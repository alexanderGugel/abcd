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
  var experimentId = $routeParams.id;

  var socket = io();

  socket.emit('debug', {
    experimentId: experimentId,
    token: localStorage.getItem('token')
  });

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
