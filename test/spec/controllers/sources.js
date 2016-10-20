/* global expect */
/* global describe */
/* global beforeEach */
/* global inject */
/* global it */

describe('Controller: SourcesCtrl', () => {
  'use strict';

  // load the controller's module
  beforeEach(module('tetApp'));

  // let SourcesCtrl;
  let scope;
  // let $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject((_$httpBackend_, $controller, $rootScope, mockINDEX) => {
    // $httpBackend = _$httpBackend_;

    // $httpBackend.expectGET(/search\/index.tsv/)
    //  .respond('label\tname\tfilename\nPhase 1 Expression Tables (Human)\tExpression (read counts) of robust phase 1 CAGE peaks for human samples\thg19.cage_peak_counts.osc.txt.gz');

    scope = $rootScope.$new();
    $controller('SourcesCtrl', {
      $scope: scope,
      index: mockINDEX
    });
  }));

  it('should attach a list of files to the scope', () => {
    // expect(scope.files).toBeUndefined();
    // $httpBackend.flush();
    expect(scope.files.length).toBe(3);
  });
});
