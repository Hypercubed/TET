#!/usr/bin/env node

/* global describe */
/* global it */

// const path = require('path'),
const http = require('http');
const assert = require('assert');
const zlib = require('zlib');

const PORT = 9779;

const f5files = require('./fixtures/fantom5-files.json');

describe('http server', () => {
  'use strict';

  const defaults = {
    pattern: '.',
    head: 1e8,
    skip: 0
  };

  const countLines = function (filename, test, callback) {
    if (typeof test === 'string') {
      test = {pattern: test};
    }

    test.pattern = encodeURIComponent(test.pattern || '.');
    test.name = test.name || test.filename;
    test.head = test.head || defaults.head;
    test.statusCode = test.statusCode || 200;
    test.skip = test.skip || 0;
    test.file = test.file || 0;

    const result = {
      filename,
      lineCount: defaults.skip
    };

    const request = http.get({host: 'localhost', port: PORT, path: '/search/?filename=' + filename + '&file=' + test.file + '&search=' + test.pattern + '&head=' + test.head + '&skip=' + test.skip});

    request.on('response', res => {
      result.statusCode = res.statusCode;

      function count(data) {
        const n = data.length;
        for (let i = 0; i < n; i++) {
          if (data[i] === 10) {
            result.lineCount++;
          }
        }
      }

      const reader = (test.file === 0) ? res : res.pipe(zlib.createGunzip());

      reader
        .on('data', count)
        .on('end', () => {
          callback(result);
        });
    });
  };

  const runTest = function (filename, params, expected) {
    if (typeof expected === 'number') {
      expected = {lineCount: expected};
    }

    let result = {};

    it('should fetch without error', function (done) {
      this.timeout(0);
      countLines(filename, params, r => {
        result = r;
        done();
      });
    });

    it('returns correct status code', () => {
      assert.equal(result.statusCode, expected.statusCode || 200);
    });

    it('line counts should match', () => {
      if (expected.lineCount) {
        assert.equal(result.lineCount, expected.lineCount);
      }
    });
  };

  describe('errors', () => {  // TODO: read from index
    describe('should return 404 on missing file', () => {
      runTest('missing.gz', '', {statusCode: 404});
    });

    describe('should return 403 on forbidden relative path', () => {
      runTest('../package.json', '', {statusCode: 403});
    });

    describe('should return 403 on forbidden absolute path', () => {
      runTest('/etc/passwd', '', {statusCode: 403});
    });
  });

  describe('files', () => {
    const test = test => {
      describe(test.filename, () => {
        runTest(test.filename, test, test.lines);
      });
    };

    for (const key in f5files) { // eslint-disable-line guard-for-in
      describe(key, () => {
        f5files[key].forEach(test);
      });
    }

    /* function runTests(tests) {
      tests.forEach(test => {
        describe(test.filename, () => {
          runTest(test.filename, test, test.lines);
        });
      });
    }

    describe('phase 1 files', () => {
      runTests([
        {filename: 'hg19.cage_peak_ann.txt.gz', lines: 1048125},
        {filename: 'hg19.cage_peak_counts_ann_decoded.osc.txt.gz', lines: 184828},
        {filename: 'hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', lines: 184828},

        {filename: 'mm9.cage_peak_ann.txt.gz', lines: 652861},
        {filename: 'mm9.cage_peak_counts_ann_decoded.osc.txt.gz', lines: 116278},
        {filename: 'mm9.cage_peak_tpm_ann_decoded.osc.txt.gz', lines: 116278}
      ]);
    });

    describe('TSS files', () => {
      runTests([
        {filename: 'TSS_human.strict.txt.gz', lines: 217573},
        {filename: 'TSS_mouse.strict.txt.gz', lines: 129467}
      ]);
    });

    describe('phase 2 files', () => {
      runTests([
        {filename: 'hg19.cage_peak_phase1and2combined_ann.txt.gz', lines: 201803},
        {filename: 'hg19.cage_peak_phase1and2combined_counts_ann_decoded.osc.txt.gz', lines: 201803},
        {filename: 'hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', lines: 201803},

        {filename: 'mm9.cage_peak_phase1and2combined_ann.txt.gz', lines: 158967},
        {filename: 'mm9.cage_peak_phase1and2combined_counts_ann_decoded.osc.txt.gz', lines: 158967},
        {filename: 'mm9.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', lines: 158967}
      ]);
    });

    describe('reprocessed files', () => {
      runTests([
        {filename: 'hg38.cage_peak_phase1and2combined_fair_ann.txt.gz', lines: 201296, columns: 7},
        {filename: 'hg38.cage_peak_phase1and2combined_fair_counts_ann.osc.txt.gz', lines: 201296, columns: 1836},
        {filename: 'hg38.cage_peak_phase1and2combined_fair_tpm_ann_fix1.osc.txt.gz', lines: 201296, columns: 1836},

        {filename: 'mm10.cage_peak_phase1and2combined_fair_ann.txt.gz', lines: 158879, columns: 7},
        {filename: 'mm10.cage_peak_phase1and2combined_fair_counts_ann.osc.txt.gz', lines: 158879, columns: 1080},
        {filename: 'mm10.cage_peak_phase1and2combined_fair_tpm_ann_fix1.osc.txt.gz', lines: 158879, columns: 1080}
      ]);
    }); */
  });

  describe('concurrent server calls', () => {
    const expectedResults = [];
    const results = [];
    let tasks = 2;

    it('should run', function (done) {
      this.timeout(0);

      countLines('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'xxxxx', head: 10}, r => {
        results[0] = r;
        tasks--;
        if (tasks <= 0) {
          done();
        }
      });
      expectedResults[0] = {lineCount: 1};

      countLines('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'MYB', head: 10}, r => {
        results[1] = r;
        tasks--;
        if (tasks <= 0) {
          done();
        }
      });
      expectedResults[1] = {lineCount: 11};
    });

    it('returns correct status code', () => {
      results.forEach((r, i) => {
        assert.equal(r.statusCode, expectedResults[i].statusCode || 200);
      });
    });

    it('line counts should match', () => {
      results.forEach((r, i) => {
        assert.equal(r.lineCount, expectedResults[i].lineCount);
      });
    });
  });

  describe('search', () => {  // TODO: test returned results
    describe('small file, early results', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chr10:100', 29);
    });

    describe('small file, early results, zipped', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', file: 1}, 29);
    });

    describe('small file, with skip, early results', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', skip: 10}, 19);
    });

    describe('small file, with head, early results', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', head: 10}, 11);
    });

    describe('small file, with head and skip, early results', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', head: 10, skip: 10}, 11);
    });

    describe('small file, late results', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chr10:1126', 29);
    });

    describe('small file, late results, zipped', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:1126', file: 1}, 29);
    });

    describe('small file, no results', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chrY:98', 1);
    });

    describe('small file, no results, zipped', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chrY:98', file: 1}, 0);  // check why this is zero
    });

    describe('large file, late results', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', 'chrY:98', 3);
    });

    describe('large file, late results, zipped', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:98', file: 1}, 3);
    });

    describe('large file, with skip, late results', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:98', skip: 2}, 1);
    });

    describe('large file, with head, late results', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:', head: 100}, 101);
    });

    describe('large file, with head and skip, late results', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:', head: 100, skip: 50}, 101);
    });

    describe('large file, everything', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', '', 184828);
    });

    describe('large file, everything, zipped', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: '', file: 1}, 184828);
    });

    describe('annotation file, entrezgene', () => {
      runTest('hg19.cage_peak_ann.txt.gz', 'entrezgene:', 245515);
    });

    describe('annotation file, entrezgene', () => {
      runTest('hg19.cage_peak_ann.txt.gz', 'entrezgene:3257', 7);
    });

    describe('annotation file, gene lower case', () => {
      runTest('hg19.cage_peak_ann.txt.gz', 'myb', 17);
    });

    describe('annotation file, gene upper case', () => {
      runTest('hg19.cage_peak_ann.txt.gz', 'MYB', 134);
    });

    describe('large file, entrezgene', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', 'entrezgene:3257', 2);
    });

    describe('count file, entrezgene', () => {
      runTest('hg19.cage_peak_counts_ann_decoded.osc.txt.gz', 'entrezgene:3257', 2);
    });

    describe('large file, no results', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', 'entrezgene:11111', 1);
    });

    // describe('large file, long preamble', () => {
    //  runTest('mm9.robust_phase1_pls_2.tpm.osc.txt.gz', '', 158967);
    // });

    // describe('large file, long preamble, with head', () => {
    //  runTest('mm9.robust_phase1_pls_2.tpm.osc.txt.gz', {pattern: '.', head: 10}, 11);
    // });

    // tests.forEach(runTest);

    /* tests.forEach(function(test) {
      const filename = test.filename;
      const pattern = test.pattern || '.';
      const expected = test.expected;
      const head = test.head || 1e16;
      const skip = test.skip || 0;

      //const gz = (filename.split('.').pop() === 'gz');
      //const filepath = path.join(dosPath, filename);
      //const pattern = patterns[i];

      describe(test.name,() => {

        describe('http server', () => {
          const httpCount = 0;

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

          it('line counts should match', () => {
            assert.equal(expected[0], httpCount);
          });
        });

      });

    }); */
  });

  describe('regex', () => {
    describe('should match string', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chr10:100', 29);
    });

    describe('should match all on blank', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '', 999);
    });

    describe('should match with carot', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:100', 29);
    });

    describe('should match positive strand', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:100\\S*,\\+', 5);
    });

    describe('should match negitave strand', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:100\\S*,\\-', 25);
    });

    // describe('should match columns', () => {
    //  countLines({ name: 'should match columns',
    //    filename: 'hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz',
    //    pattern: '^(\\S*\\s){2}.*chr10:100',
    //    expected: [20, 999] });
    // })

    describe('should match columns', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^\\S*\\s.*chr10:100', 20);
    });

    describe('should accept implicit or', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:1000 ^chr10:1001', 11);
    });

    describe('should accept explicit or', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:1000|^chr10:1001', 11);
    });

    describe('should accept implicit or', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:1000\n^chr10:1001', 11);
    });

    describe('should reject unsafe regex', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '(a+){10}', {statusCode: 400});
    });

    describe('should reject invalid regex', () => {
      runTest('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '*chr10*', {statusCode: 400});
    });
  });
});
