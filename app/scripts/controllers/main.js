/* global $, angular */

'use strict';

angular.module('tetApp')
  .controller('MainCtrl', ['$scope', '$http', '$location', '$routeParams', '$window', 'dsv', 'cfpLoadingBar', 'index',
  function ($scope, $http, $location, $routeParams, $window, dsv, cfpLoadingBar, index) { // eslint-disable-line max-params
    var defaultSearch = {
      head: 10,
      skip: 0,
      c: [0],
      q: ''
    };

    $scope.sets = $window.d3.nest()
      .key(function (d) {
        return d.label;
      })
      .entries(index);                   // Resolved in router

    function loadParams(def) { // TODO: a service?
      var s = angular.extend({}, def, $location.search());

      s.filename = $routeParams.filename || $scope.sets[0].values[0].filename;

      s.c = (angular.isArray(s.c)) ?
        s.c.map(function (d) {
          return Number(d);
        }) : [Number(s.c)];

      return s;
    }

    function storeParams(search, def) {
      var s = angular.extend({}, search);

      delete s.filename;

      angular.forEach(s, function (v, k) {
        if (angular.equals(v, def[k])) {
          delete s[k];
        }
      });

      $location.search(s).replace();
    }

    // $scope.filename = $routeParams.filename || $scope.sets[0].values[0].filename;

    $scope.search = loadParams(defaultSearch);
    storeParams($scope.search, defaultSearch);

    $scope.loading = true;
    $scope.data = null;

    function loadData() {
      $scope.search.head = Number($scope.search.head);

      dsv.tsv.getRows('search/', {params: $scope.search, cache: true}).success(function (data) {
        $scope.header = data[0];
        $scope.data = data.slice(1);
        $scope.offset = $scope.search.skip;
      });
    }

    $scope.showTable = function () {
      $scope.data = [];
      $scope.search.skip = 0;
      storeParams($scope.search, defaultSearch);
      loadData();

      $('#tableModal').modal({backdrop: 'static'}).on('hidden.bs.modal', function () {
        $scope.data = null;
      });
    };

    $scope.next = function () {
      $scope.search.skip = ($scope.search.skip || 0) + (Number($scope.search.head));
    };

    $scope.prev = function () {
      $scope.search.skip = Math.max(($scope.search.skip || 0) - Number($scope.search.head), 0);
    };

    $scope.submit = function () {
      // console.log('test');
    };

    $scope.introjs = $window.introJs();

    $scope.$watch('search.filename', function (filename) {
      $scope.loading = true;

      if (!filename) {
        $scope.loading = false;
        return;
      }

      var path = 'search/' + filename;
      var params = {head: 0};

      $location.path(path);

      dsv.tsv.getRows(path, {params: params, cache: true}).success(function (data) {
        var c = data[0].map(function (d, i) {
          return {
            name: decodeURIComponent(d),
            index: i,
            ticked: ($scope.search.c.indexOf(i) > -1)
          };
        });

        $scope.columns = c;
        $scope.loading = false;
      });
    });

    $scope.$watchCollection('search', function (newVal, oldVal) {
      if (newVal === oldVal) {
        return;
      }
      storeParams(newVal, defaultSearch);
      if ($scope.data) {
        loadData();
      }
    });

    $scope.$watch('columns', function (newVal, oldVal) {
      // console.log('columns', newVal, oldVal);
      if (newVal === oldVal) {
        return;
      }
      if (!newVal) {
        newVal = [];
      }

      var c = [];
      newVal.forEach(function (d, i) {
        if (d.ticked) {
          c.push(i);
        }
      });

      $scope.search.c = c;
      storeParams($scope.search, defaultSearch);
    }, true);
  }]);

angular.module('tetApp')
  .filter('decodeURIComponent', ['$window', function ($window) {
    return $window.decodeURIComponent;
  }]);
