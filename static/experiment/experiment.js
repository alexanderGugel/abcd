'use strict';

angular.module('angularApp.experiment', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/experiments/:id', {
    templateUrl: 'experiment/experiment.html',
    controller: 'ExperimentCtrl',
    restricted: true
  });
}])

.directive('chart', [function () {
  var link = function (scope, element, attrs) {
    var margin = {top: 10, right: 10, bottom: 100, left: 40},
    margin2 = {top: 10, right: 10, bottom: 20, left: 40},
    width = 600 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    height2 = 300;

    var parseDate = d3.time.format("%b %Y").parse;

    var x = d3.time.scale().range([0, width]),
        x2 = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom"),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
        yAxis = d3.svg.axis().scale(y).orient("left");

    var brush = d3.svg.brush()
        .x(x2)
        .on("brush", brushed);

    var area = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { return x(d.date); })
        .y0(height)
        .y1(function(d) { return y(d.price); });

    var area2 = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { return x2(d.date); })
        .y0(height2)
        .y1(function(d) { return y2(d.price); });

    var svg = d3.select(element[0]).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    d3.csv("experiment/sp500.csv", type, function(error, data) {
      x.domain(d3.extent(data.map(function(d) { return d.date; })));
      y.domain([0, d3.max(data.map(function(d) { return d.price; }))]);
      x2.domain(x.domain());
      y2.domain(y.domain());

      focus.append("path")
          .datum(data)
          .attr("class", "area")
          .attr("d", area);

      focus.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      focus.append("g")
          .attr("class", "y axis")
          .call(yAxis);

      context.append("path")
          .datum(data)
          .attr("class", "area")
          .attr("d", area2);

      context.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height2 + ")")
          .call(xAxis2);

      context.append("g")
          .attr("class", "x brush")
          .call(brush)
        .selectAll("rect")
          .attr("y", -6)
          .attr("height", height2 + 7);
    });

    function brushed() {
      x.domain(brush.empty() ? x2.domain() : brush.extent());
      focus.select(".area").attr("d", area);
      focus.select(".x.axis").call(xAxis);
    }

    function type(d) {
      d.date = parseDate(d.date);
      d.price = +d.price;
      return d;
    }
  };

  return {
    link: link,
    restrict: 'E'
  };
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

  $scope.resetExperiment = function (experiment) {
    var confirmation = confirm('Are you sure you want to reset this experiment? This will delete all associated actions and conversions.');
    if (!confirmation) {
      return;
    }
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
