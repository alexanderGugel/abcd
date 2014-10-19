'use strict';

angular.module('angularApp.drop', [])

.directive('drop', [function() {
  var link = function (scope, element, attrs) {
    attrs.target = element[0];
    for (var )
    scope[attrs.drop || 'drop'] = new Drop(attrs);
  };

  return {
    scope: false,
    link: link
  };
}]);
