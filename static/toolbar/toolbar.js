'use strict';

angular.module('angularApp.toolbar', [])

.directive('toolbarUserDropdown', ['$rootScope', function($rootScope) {
  var link = function (scope, element, attrs) {
    // attrs.target = element[0];
    // for (var )
    // scope[attrs.drop || 'drop'] = new Drop(attrs);
    var drop = new Drop({
      target: element[0],
      content:
        '<a href="#/settings"><i class="icon ion-gear-a"></i> Account settings</a>' +
        '<br>' +
        '<a href="#/logout"><i class="icon ion-log-out"></i> Sign Out</a>',
      // classes: 'drop-theme-arrows-bounce popover',
      position: 'top right'
    });
    $rootScope.$on('$routeChangeStart', function (event, next) {
      drop.close();
    });
  };

  return {
    link: link
  };
}])

.directive('toolbarProjectsDropdown', ['$rootScope', function($rootScope) {
  var link = function (scope, element, attrs) {
    var drop = new Drop({
      target: element[0],
      content:
        '<a href="#/logout" class="create-project"><i class="icon ion-ios7-plus-empty"></i> Create Project</a>',
      classes: 'projects',
      position: 'top left'
    });
    $rootScope.$on('$routeChangeStart', function (event, next) {
      drop.close();
    });
  };

  return {
    link: link
  };
}])

.directive('toolbarCreateProjectDropdown', ['$rootScope', function($rootScope) {
  var link = function (scope, element, attrs) {
    var drop = new Drop({
      target: element[0],
      content:
        '<input ng-model="test">',
      classes: 'create-project',
      position: 'top left'
    });
    $rootScope.$on('$routeChangeStart', function (event, next) {
      drop.close();
    });
  };

  return {
    link: link
  };
}])

.directive('toolbar', [function() {
  var link = function (scope, element, attrs) {
  };

  return {
    // link: link,
    restrict: 'E',
    templateUrl: 'toolbar/toolbar.html'
  };
}]);
