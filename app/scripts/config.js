/* global angular */

(function (angular) {
  'use strict';

  var indexResolve = {
    index: ['dsv', function (dsv) {
      return dsv.tsv.get('data/index.tsv').then(function (res) {
        return res.data;
      });
    }]
  };

  var searchRoute = {
    templateUrl: 'views/main.html',
    controller: 'MainCtrl',
    resolve: indexResolve,
    reloadOnSearch: false
  };

  angular.module('tetApp')
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
      $routeProvider
        .when('/search', searchRoute)
        .when('/search/:filename', searchRoute)
        .when('/search/?filename=:filename', searchRoute)
        .when('/help', {
          templateUrl: 'views/help.html'
        })
        .when('/sources', {
          templateUrl: 'views/sources.html',
          controller: 'SourcesCtrl',
          resolve: indexResolve
        })
        .otherwise({
          redirectTo: '/search'
        });

      $locationProvider.html5Mode(false).hashPrefix('!');
    }]);

  // angular.module('tetApp')
  //  .config(['searchAPIProvider', function (searchAPIProvider) {
  //    searchAPIProvider.baseurl('search');
  //  }]);
})(angular);
