'use strict';

angular.module('angularApp.toolbar', [])

.directive('toolbar', [function() {
  var link = function (scope, element, attrs) {
    // attrs.target = element[0];
    // for (var )
    // scope[attrs.drop || 'drop'] = new Drop(attrs);
  };

  return {
    link: link,
    restrict: 'E',
    templateUrl: 'toolbar/toolbar.html'
  };
}]);
