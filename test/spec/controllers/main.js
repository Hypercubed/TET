/* global expect */
/* global describe */
/* global beforeEach */
/* global inject */
/* global it */

describe('Controller: MainCtrl', function () {
  'use strict';

  // load the controller's module
  beforeEach(module('tetApp'));

  var MainCtrl,
    scope,
    $httpBackend,
    filename;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope, mockINDEX, mockHEADER) {
    $httpBackend = _$httpBackend_;

    filename = mockINDEX[0].filename;

    $httpBackend.expectGET(/search\/file1\.txt.gz?.*/)
      .respond(mockHEADER);

    scope = $rootScope.$new();
    MainCtrl = $controller('MainCtrl', {
      $scope: scope,
      index: mockINDEX
    });
  }));

  it('should attach a list of files to the scope', function () {
    //$httpBackend.flush();

    expect(scope.sets.length).toBe(2);
    //expect(scope.columns.length).toBe(2);

    expect(scope.search.filename).toBe('file1.txt.gz');
    //expect(scope.columns[0]).toEqual({ name : '00Annotation', index : 0, ticked : true });
    //expect(scope.columns[1]).toEqual({ name : 'counts.Adipocyte - breast, donor1.CNhs11051.11376-118A8', index : 1, ticked : false });
  });
});
