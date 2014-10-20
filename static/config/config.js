'use strict';

angular.module('angularApp.config', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/config', {
    templateUrl: 'config/config.html',
    controller: 'ConfigCtrl'
  });
}])

.directive('highlight', [function() {
  var link = function (scope, element, attrs) {
    hljs.highlightBlock(element[0]);
  };

  return {
    restrict: 'E',
    link: link
  };
}])

.controller('ConfigCtrl', ['$scope', '$http', '$location', '$rootScope', function ($scope, $http, $location, $rootScope) {
  $scope.addEndpoint = function () {
    $http.post('/api/endpoints', {
      token: localStorage.getItem('token')
    })
    .success(function (data) {
      // swal('Created!', 'Successfully created new endpoint ' + data.endpoint.id + ' .', 'success');
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

  $scope.deactivateEndpoint = function (endpoint) {
    // swal({
    //   title: 'Are you sure?',
    //   text: 'This is going to delete endpoint ' + endpoint.id + ' and all associated experiments!',
    //   type: 'warning',
    //   showCancelButton: true,
    //   confirmButtonColor: '#DD6B55',
    //   confirmButtonText: 'Yes, delete it!',
    //   closeOnConfirm: false
    // }, function () {
      $http({
        url: '/api/endpoints/' + endpoint.id,
        method: 'DELETE',
        params: {
          token: localStorage.getItem('token')
        }
      })
      .success(function (data) {
        // $scope.refresh();
        endpoint.is_active = false;
        // swal('Deleted!', 'Endpoint ' + endpoint.id + ' has been deleted.', 'success');
      });
    // });
  };

  $scope.activateEndpoint = function (endpoint) {
    $http({
      url: '/api/endpoints/' + endpoint.id,
      method: 'PATCH',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      endpoint.is_active = true;
      // $scope.refresh();
    });
  };

  $scope.loadUsage = function () {
    $http({
      url: '/api/usage',
      method: 'GET',
      params: {
        token: localStorage.getItem('token')
      }
    })
    .success(function (data) {
      $scope.usage = data.usage;
    });
  };

  $scope.loadUsage();

  $scope.refresh();
}]);
