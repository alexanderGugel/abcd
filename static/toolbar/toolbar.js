'use strict';

angular.module('angularApp.toolbar', [])

.directive('toolbarUserDropdown', ['$rootScope', function($rootScope) {
  var link = function (scope, element, attrs) {
    var drop = new Drop({
      target: element[0],
      content:
        '<a href="#/usage"><i class="icon ion-android-data"></i> Usage</a>' +
        '<br>' +
        '<a href="#/settings"><i class="icon ion-gear-a"></i> Account settings</a>' +
        '<br>' +
        '<a href="#/logout"><i class="icon ion-log-out"></i> Sign Out</a>',
      classes: 'drop-theme-arrows-bounce',
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

.directive('toolbar', [function() {
  var link = function (scope, element, attrs) {
  };

  return {
    // link: link,
    restrict: 'E',
    templateUrl: 'toolbar/toolbar.html'
  };
}]);
