'use strict';

angular.module('tetApp')
  .controller('SourcesCtrl', ['$scope','index', function ($scope, index) {

    $scope.files = index;

  }]);
