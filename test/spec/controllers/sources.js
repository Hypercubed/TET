/* global expect */
/* global describe */
/* global beforeEach */
/* global inject */
/* global it */

describe('Controller: SourcesCtrl', function () {
  'use strict';

  // load the controller's module
  beforeEach(module('tetApp'));

  var SourcesCtrl,
    scope,
    $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope, mockINDEX) {
    $httpBackend = _$httpBackend_;

    //$httpBackend.expectGET(/search\/index.tsv/)
    //  .respond('label\tname\tfilename\nPhase 1 Expression Tables (Human)\tExpression (read counts) of robust phase 1 CAGE peaks for human samples\thg19.cage_peak_counts.osc.txt.gz');

    scope = $rootScope.$new();
    SourcesCtrl = $controller('SourcesCtrl', {
      $scope: scope,
      index: mockINDEX
    });
  }));

  it('should attach a list of files to the scope', function () {
    //expect(scope.files).toBeUndefined();
    //$httpBackend.flush();
    expect(scope.files.length).toBe(3);
  });
});
