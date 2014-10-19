'use strict';

angular.module('angularApp.toolbar', [])

.directive('profileLink', ['$rootScope', function($rootScope) {
  var link = function (scope, element, attrs) {
    // attrs.target = element[0];
    // for (var )
    // scope[attrs.drop || 'drop'] = new Drop(attrs);
    var drop = new Drop({
      target: element[0],
      content:
        '<a href="#/settings"><i class="icon ion-gear-a"></i> Account settings</a>' +
        '<br>' +
        '<a href="#/logout"><i class="icon ion-log-out"></i> Signout</a>',
      classes: 'drop-theme-arrows-bounce popover',
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
    // attrs.target = element[0];
    // for (var )
    // scope[attrs.drop || 'drop'] = new Drop(attrs);
    // debugger;
    // new Drop({
    //   target: element[0],
    //   content: 'test',
    //   classes: 'drop-theme-arrows',
    // });
  };

  return {
    link: link,
    restrict: 'E',
    templateUrl: 'toolbar/toolbar.html'
  };
}]);
