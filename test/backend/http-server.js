#!/usr/bin/env node

/* global describe */
/* global it */

var //path = require('path'),
  http = require('http'),
  assert = require('assert')
  ;

var PORT = 9779;

describe('http server',function() {
  'use strict';

  var defaults = {
    pattern: '.',
    head: 1e8,
    skip: 0
  };

  var countLines = function(filename, test, callback) {

    if (typeof test === 'string') {
      test = { pattern: test };
    }

    test.pattern = encodeURIComponent(test.pattern || '.');
    test.name = test.name || test.filename;
    test.head = test.head || defaults.head;
    test.statusCode =  test.statusCode || 200;
    test.skip = test.skip || 0;

    var result = { filename: filename };
    result.lineCount = defaults.skip;

    http.get({host: 'localhost', port:PORT, path: '/search/?filename='+filename+'&search='+test.pattern+'&head='+test.head+'&skip='+test.skip}, function(res) {
      result.statusCode = res.statusCode;

      res.on('data', function(body) {
        result.lineCount += (String(body).match(/\n+/g) || '').length;
      });

      res.on('end', function() {
        //done();
        callback(result);
      });

    });

  };

  var runTest = function(filename, params, expected) {

    if (typeof expected === 'number') {
      expected = { lineCount: expected };
    }

    var result = {};

    it('should fetch without error', function(done) {
      this.timeout(0);
      countLines(filename, params, function(r) {
        result = r;
        done();
      });
    });

    it('returns correct status code', function() {
      assert.equal(result.statusCode,expected.statusCode || 200);
    });

    it('line counts should match', function() {
      if (expected.lineCount) {
        assert.equal(result.lineCount,expected.lineCount);
      }
    });

  };

  describe('errors',function() {  // TODO: read from index

    describe('should return 404 on missing file', function() {
      runTest('missing.gz', '', { statusCode: 404 });
    });

    describe('should return 403 on forbidden relative path', function() {
      runTest('../package.json', '', { statusCode: 403 });
    });

    describe('should return 403 on forbidden absolute path', function() {
      runTest('/etc/passwd', '', { statusCode: 403 });
    });

  });

  describe('files',function() {  // TODO: read from index

    describe('phase 1 files', function() {
      var tests = [
          { filename: 'hg19.cage_peak_ann.txt.gz', expected: 1048125 },
          { filename: 'hg19.cage_peak_counts_ann_decoded.osc.txt.gz', expected: 184828 },
          { filename: 'hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', expected: 184828 },

          { filename: 'mm9.cage_peak_ann.txt.gz', expected: 652861 },
          { filename: 'mm9.cage_peak_counts_ann_decoded.osc.txt.gz', expected: 116278 },
          { filename: 'mm9.cage_peak_tpm_ann_decoded.osc.txt.gz', expected: 116278 }
        ];

      tests.forEach(function(test) {
        describe(test.filename, function() {
          runTest(test.filename,test,test.expected);
        });
      });
    });

    describe('TSS files', function() {
      var tests = [
          { filename: 'TSS_human.strict.txt.gz', expected: 217573 },
          { filename: 'TSS_mouse.strict.txt.gz', expected: 129467 }
        ];

      tests.forEach(function(test) {
        describe(test.filename, function() {
          runTest(test.filename,test,test.expected);
        });
      });
    });

    describe('phase 2 files', function() {
      var tests = [
        { filename: 'hg19.cage_peak_phase1and2combined_ann.txt.gz', expected: 201803 },
        { filename: 'hg19.cage_peak_phase1and2combined_counts_ann_decoded.osc.txt.gz', expected: 201803 },
        { filename: 'hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', expected: 201803 },

        { filename: 'mm9.cage_peak_phase1and2combined_ann.txt.gz', expected: 158967 },
        { filename: 'mm9.cage_peak_phase1and2combined_counts_ann_decoded.osc.txt.gz', expected: 158967 },
        { filename: 'mm9.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', expected: 158967 }
      ];

      tests.forEach(function(test) {
        describe(test.filename, function() {
          runTest(test.filename,test,test.expected);
        });
      });
    });

  });

  describe('concurrent server calls', function() {

    var expectedResults = [];
    var results = [];
    var tasks = 2;

    it('should run', function (done) {
      this.timeout(0);

      countLines('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', { pattern: 'xxxxx', head: 10 }, function(r) {
        results[0] = r;
        tasks--;
        if (tasks <= 0) {
          done();
        }
      });
      expectedResults[0] = { lineCount: 1 };

      countLines('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', { pattern: 'MYB', head: 10 }, function(r) {
        results[1] = r;
        tasks--;
        if (tasks <= 0) {
          done();
        }
      });
      expectedResults[1] = { lineCount: 11 };

    });

    it('returns correct status code', function() {
      results.forEach(function(r,i) {
        assert.equal(r.statusCode,expectedResults[i].statusCode || 200);
      });
    });

    it('line counts should match', function() {
      results.forEach(function(r,i) {
        assert.equal(r.lineCount,expectedResults[i].lineCount);
      });
    });

  });


  describe('search',function() {  // TODO: test returned results

    describe('small file, early results', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chr10:100', 29);
    });

    describe('small file, with skip, early results', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', skip: 10}, 19);
    });

    describe('small file, with head, early results', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', head: 10}, 11);
    });

    describe('small file, with head and skip, early results', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', head: 10, skip: 10}, 11);
    });

    describe('small file, late results', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chr10:1126', 29);
    });

    describe('small file, no results', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chrY:98', 1);
    });

    describe('large file, late results', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', 'chrY:98', 3);
    });

    describe('large file, with skip, late results', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:98', skip: 2}, 1);
    });

    describe('large file, with head, late results', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:', head: 100}, 101);
    });

    describe('large file, with head and skip, late results', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:', head: 100, skip: 50,}, 101);
    });

    describe('large file, everything', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', '', 184828);
    });

    describe('annotation file, entrezgene', function() {
      runTest('hg19.cage_peak_ann.txt.gz', 'entrezgene:', 245515);
    });

    describe('annotation file, entrezgene', function() {
      runTest('hg19.cage_peak_ann.txt.gz', 'entrezgene:3257', 7);
    });

    describe('annotation file, gene lower case', function() {
      runTest('hg19.cage_peak_ann.txt.gz', 'myb', 17);
    });

    describe('annotation file, gene upper case', function() {
      runTest('hg19.cage_peak_ann.txt.gz', 'MYB', 134);
    });

    describe('large file, entrezgene', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', 'entrezgene:3257', 2);
    });

    describe('count file, entrezgene', function() {
      runTest('hg19.cage_peak_counts_ann_decoded.osc.txt.gz', 'entrezgene:3257', 2);
    });

    describe('large file, no results', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', 'entrezgene:11111', 1);
    });

    //describe('large file, long preamble', function() {
    //  runTest('mm9.robust_phase1_pls_2.tpm.osc.txt.gz', '', 158967);
    //});

    //describe('large file, long preamble, with head', function() {
    //  runTest('mm9.robust_phase1_pls_2.tpm.osc.txt.gz', {pattern: '.', head: 10}, 11);
    //});

    //tests.forEach(runTest);

    /* tests.forEach(function(test) {
      var filename = test.filename;
      var pattern = test.pattern || '.';
      var expected = test.expected;
      var head = test.head || 1e16;
      var skip = test.skip || 0;

      //var gz = (filename.split('.').pop() === 'gz');
      //var filepath = path.join(dosPath, filename);
      //var pattern = patterns[i];

      describe(test.name,function() {

        describe('http server', function() {
          var httpCount = 0;

          it('should fetch data from server', function (done) {
            this.timeout(0);

            http.get({host: 'localhost', port:PORT, path: '/search/'+filename+'?search='+pattern+'&head='+head+'&skip='+skip}, function(res) {

              res.on('data', function(body) {
                assert.equal(res.statusCode, 200);
                httpCount += (String(body).match(/\n+/g) || '').length;
              });

              res.on('end', done);

            });
          });

          it('line counts should match', function() {
            assert.equal(expected[0], httpCount);
          });
        });

      });

    }); */

  });

  describe('regex',function() {

    describe('should match string', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chr10:100', 29);
    });

    describe('should match all on blank', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '', 999);
    });

    describe('should match with carot', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:100', 29);
    });

    describe('should match positive strand', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:100\\S*,\\+', 5);
    });

    describe('should match negitave strand', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:100\\S*,\\-', 25);
    });

    //describe('should match columns', function() {
    //  countLines({ name: 'should match columns',
    //    filename: 'hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz',
    //    pattern: '^(\\S*\\s){2}.*chr10:100',
    //    expected: [20, 999] });
    //})

    describe('should match columns', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^\\S*\\s.*chr10:100', 20);
    });

    describe('should accept implicit or', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:1000 ^chr10:1001', 11);
    });

    describe('should accept explicit or', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:1000|^chr10:1001', 11);
    });

    describe('should accept implicit or', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:1000\n^chr10:1001', 11);
    });

    describe('should reject unsafe regex', function() {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '(a+){10}', { statusCode: 403 });
    });

  });


});
