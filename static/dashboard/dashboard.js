'use strict';

angular.module('angularApp.dashboard', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/dashboard', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'DashboardCtrl'
  });
}])

.controller('DashboardCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
  window.s = $scope;

  if (localStorage.getItem('token') === null) {
    $location.path('/');
    return;
  }

  $scope.addEndpoint = function () {
    $http.post('/api/endpoints', {
      token: localStorage.getItem('token')
    })
    .success(function (data) {
      swal('Created!', 'Successfully created new endpoint ' + data.endpoint.id + ' .', 'success');
      $scope.refresh();
    });
  };

  $scope.refresh = function () {
    $http({
      url: '/api/endpoints',
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      $scope.endpoints = data.endpoints;
    });
  };

  $scope.deleteEndpoint = function (endpoint) {
    swal({
      title: 'Are you sure?',
      text: 'This is going to delete endpoint ' + endpoint.id + ' and all associated experiments!',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it!',
      closeOnConfirm: false
    }, function () {
      $http({
        url: '/api/endpoints/' + endpoint.id,
        method: 'DELETE',
        params: {
          token: localStorage.getItem('token')
        }
      })
      .success(function (data) {
        $scope.refresh();
        swal('Deleted!', 'Endpoint ' + endpoint.id + ' has been deleted.', 'success');
      });
    });
  };

  $scope.refresh();
}]);
