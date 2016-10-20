#!/usr/bin/env node

/* global describe */
/* global it */

const path = require('path');
// const fs = require('fs');
// const zlib = require('zlib');
const stream = require('stream');
const assert = require('assert');
// const events = require('events');
// const util = require('util');

const expect = require('chai').expect;

const extract = require('./../../lib/controllers/extract.js');

const dosPath = path.join(__dirname, '/../../data/');

describe('extract.js', () => {
  'use strict';

  const mockWriteStream = () => {
    const ws = new stream.Writable();

    const data = ws.data = {
      lineCount: 0,
      columns: null,
      header: '',
      first: null,
      last: null
    };

    ws._write = function (line, enc, next) {
      line = String(line);
      const c = line.split('\t').length;
      if (data.lineCount++ === 0) {
        data.header = line;
        data.columns = c;
      } else {
        if (data.lineCount === 2) {
          data.first = line;
        }
        data.last = line;
        data.columns = (data.columns + c) / 2;
      }
      next();
    };

    return ws;
  };

  const run = function (filename, params, expected, callback) {
    const filepath = path.join(dosPath, filename);
    const ws = mockWriteStream();

    const fn = (err, data) => {
      if (expected) {
        if (typeof expected === 'number') {
          expected = [expected];
        }
        expected.forEach((d, i) => {
          assert.equal(d, data[i], 'Expected line count ' + i + ' to match ' + d + ' == ' + data[i]);
        });
      }

      if (callback) {
        ws.data.response = data;
        callback(err, ws.data);
      }
    };

    if (typeof params === 'string') {
      params = {pattern: params};
    }

    extract.search(filepath, ws, params, fn);
  };

  describe('files', function () {
    this.timeout(0);

    describe('phase 1 files', () => {
      const tests = [
        {filename: 'hg19.cage_peak_ann.txt.gz', lines: 1048125, columns: 7},
        {filename: 'hg19.cage_peak_counts_ann_decoded.osc.txt.gz', lines: 184828, columns: 896},
        {filename: 'hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', lines: 184828, columns: 896},
        {filename: 'mm9.cage_peak_ann.txt.gz', lines: 652861, columns: 6},
        {filename: 'mm9.cage_peak_counts_ann_decoded.osc.txt.gz', lines: 116278, columns: 395},
        {filename: 'mm9.cage_peak_tpm_ann_decoded.osc.txt.gz', lines: 116278, columns: 395}
      ];

      tests.forEach(test => {
        it(test.filename, done => {
          run(test.filename, '', test.lines, (err, data) => {
            expect(err).to.equal(null);
            expect(data.columns).to.equal(test.columns);
            done();
          });
        });
      });
    });

    describe('TSS files', () => {
      const tests = [
        {filename: 'TSS_human.strict.txt.gz', lines: 217573, columns: 2},
        {filename: 'TSS_mouse.strict.txt.gz', lines: 129467, columns: 2}
      ];

      tests.forEach(test => {
        it(test.filename, done => {
          run(test.filename, '', test.lines, (err, data) => {
            expect(err).to.equal(null);
            expect(data.columns).to.equal(test.columns);
            done();
          });
        });
      });
    });

    describe('phase 2 files', () => {
      const tests = [
        {filename: 'hg19.cage_peak_phase1and2combined_ann.txt.gz', lines: 201803, columns: 7},
        {filename: 'hg19.cage_peak_phase1and2combined_counts_ann_decoded.osc.txt.gz', lines: 201803, columns: 1836},
        {filename: 'hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', lines: 201803, columns: 1836},
        {filename: 'hg19.cage_peak_phase1and2combined_rel_expr.txt.gz', lines: 201803, columns: 1830},

        {filename: 'mm9.cage_peak_phase1and2combined_ann.txt.gz', lines: 158967, columns: 6},
        {filename: 'mm9.cage_peak_phase1and2combined_counts_ann_decoded.osc.txt.gz', lines: 158967, columns: 1079},
        {filename: 'mm9.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', lines: 158967, columns: 1079},
        {filename: 'mm9.cage_peak_phase1and2combined_rel_expr.txt.gz', lines: 158967, columns: 1074}
      ];

      tests.forEach(test => {
        it(test.filename, done => {
          run(test.filename, '', test.lines, (err, data) => {
            expect(err).to.equal(null);
            expect(data.columns).to.equal(test.columns);
            done();
          });
        });
      });
    });
  });

  describe('search', () => {
    describe('small file', function () {
      this.timeout(4000);

      it('header only', done => {
        run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: '', head: 0}, 1, (err, data) => {
          expect(err).to.equal(null);
          expect(data.header.split('\t')[0]).to.equal('00Annotation');
          expect(data.first).to.be.a('null');
          expect(data.last).to.be.a('null');
          expect(data.response[1]).to.be.lt(999);
          done();
        });
      });

      it('early results', done => {
        run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chr10:100', [29, 999], (err, data) => {
          expect(err).to.equal(null);
          expect(data.header.split('\t')[0]).to.equal('00Annotation');
          expect(data.first).to.match(/^chr10:100013403..100013414,-/);
          expect(data.last).to.match(/^chr10:100995626..100995635,-/);
          expect(data.response[1]).to.be.lt(1000);
          done();
        });
      });

      it('no results', done => {
        run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chrY:98', [1, 999], (err, data) => {
          expect(err).to.equal(null);
          expect(data.header.split('\t')[0]).to.equal('00Annotation');
          expect(data.first).to.be.a('null');
          expect(data.last).to.be.a('null');
          expect(data.response[1]).to.be.lt(1000);
          done();
        });
      });

      it('everything', done => {
        run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '.', [999, 999], (err, data) => {
          expect(err).to.equal(null);
          expect(data.header.split('\t')[0]).to.equal('00Annotation');
          expect(data.first).to.match(/^chr10:100013403..100013414,-\t/);
          expect(data.last).to.match(/^chr10:112697006..112697014,-\t/);
          expect(data.response[1]).to.be.lt(1000);
          done();
        });
      });

      it('with skip, early results', done => {
        run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', skip: 10}, [19, 999], (err, data) => {
          expect(err).to.equal(null);
          expect(data.header.split('\t')[0]).to.equal('00Annotation');
          expect(data.first).to.match(/^chr10:100204220..100204230,-\t/);
          expect(data.last).to.match(/^chr10:100995626..100995635,-\t/);
          done();
        });
      });

      it('with head, early results', done => {
        run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', head: 10}, 11, done);
      });

      it('with head and skip, early results', done => {
        run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', head: 10, skip: 10}, 11, done);
      });

      it('late results', done => {
        run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chr10:1126', [29, 999], done);
      });
    });

    describe('large file', function () {
      this.timeout(4000);

      it('header only', function (done) {
        this.timeout(30);

        run('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: '', head: 0}, 1, (err, data) => {
          expect(err).to.equal(null);
          expect(data.header.split('\t')[0]).to.equal('00Annotation');
          expect(data.first).to.be.a('null');
          expect(data.last).to.be.a('null');
          expect(data.response[1]).to.be.lt(128);  // Shouldn't search whole file
          done();
        });
      });

      it('early results', function (done) {  // Shouldn't search whole file
        this.timeout(30);

        run('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'chr10:100', head: 10}, 11, (err, data) => {
          expect(err).to.equal(null);
          expect(data.response[1]).to.be.lt(128);
          expect(data.first).to.match(/chr10:100/);
          expect(data.last).to.match(/chr10:100/);
          done();
        });
      });

      it('no results', done => {
        run('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', 'chrQ:98', [1, 184828], (err, data) => {
          expect(err).to.equal(null);
          expect(data.header.split('\t')[0]).to.equal('00Annotation');
          expect(data.first).to.be.a('null');
          expect(data.last).to.be.a('null');
          expect(data.response[1]).to.be.lt(184829);
          done();
        });
      });

      it('everything', done => {
        run('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', '', [184828, 184828], (err, data) => {
          expect(err).to.equal(null);
          expect(data.header.split('\t')[0]).to.equal('00Annotation');
          expect(data.first).to.match(/^chr10:100013403..100013414,-/);
          expect(data.last).to.match(/^chrY:9872906..9872914,-/);
          expect(data.response[1]).to.be.lt(184829);
          done();
        });
      });

      it('late results', done => {
        run('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', 'chrY:98', [3, 184828], done);
      });

      it('with skip, late results', done => {
        run('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:98', skip: 2}, 1, done);
      });

      it('with head, late results', done => {
        run('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:', head: 100}, 101, done);
      });

      it('with head and skip, late results', done => {
        run('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:', head: 100, skip: 50}, 101, done);
      });

      it('entrezgene', done => {
        run('hg19.cage_peak_ann.txt.gz', 'entrezgene:', [245515, 1048125], done);
      });

      it('entrezgene', done => {
        run('hg19.cage_peak_ann.txt.gz', 'entrezgene:3257', [7, 1048125], done);
      });

      it('gene lower case', done => {
        run('hg19.cage_peak_ann.txt.gz', 'myb', [17, 1048125], done);
      });

      it('gene upper case', done => {
        run('hg19.cage_peak_ann.txt.gz', 'MYB', [134, 1048125], done);
      });

      it('entrezgene', done => {
        run('hg19.cage_peak_tpm_ann_decoded.osc.txt.gz', 'entrezgene:3257', [2, 184828], done);
      });

      it('entrezgene', done => {
        run('hg19.cage_peak_counts_ann_decoded.osc.txt.gz', 'entrezgene:3257', [2, 184828], done);
      });

      it('long preamble', done => {
        run('mm9.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', {pattern: '.'}, [158967, 158967], done);
      });

      it('long preamble, with head', done => {
        run('mm9.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', {pattern: '.', head: 10}, 11, done);
      });

      it('long preamble, with pattern', done => {  // Shouldn't search whole file
        run('mm9.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', {pattern: 'chr10:100'}, [15, 158967], (err, data) => {
          expect(err).to.equal(null);
          expect(data.first).to.match(/chr10:100/);
          expect(data.last).to.match(/chr10:100/);
          done();
        });
      });
    });

    describe('x-large file', function () {
      this.timeout(0);

      it('header only', function (done) {
        this.timeout(60);

        run('hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', {pattern: '', head: 0}, 1, (err, data) => {
          expect(err).to.equal(null);
          expect(data.header.split('\t')[0]).to.equal('00Annotation');
          expect(data.first).to.be.a('null');
          expect(data.last).to.be.a('null');
          expect(data.response[1]).to.be.lt(128);  // Shouldn't search whole file
          done();
        });
      });

      it('early results', function (done) {  // Shouldn't search whole file
        this.timeout(60);

        run('hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', {pattern: 'chr10:100', head: 10}, 11, (err, data) => {
          expect(err).to.equal(null);
          expect(data.response[1]).to.be.lt(128);
          expect(data.first).to.match(/chr10:100/);
          expect(data.last).to.match(/chr10:100/);
          done();
        });
      });

      it('no results', done => {
        run('hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', 'chrQ:98', [1, 201803], (err, data) => {
          expect(err).to.equal(null);
          expect(data.header.split('\t')[0]).to.equal('00Annotation');
          expect(data.first).to.be.a('null');
          expect(data.last).to.be.a('null');
          expect(data.response[1]).to.be.lte(201803);
          done();
        });
      });

      it('everything', done => {
        run('hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', '', [201803, 201803], (err, data) => {
          expect(err).to.equal(null);
          expect(data.header.split('\t')[0]).to.equal('00Annotation');
          expect(data.first).to.match(/^chr10:100013403..100013414,-/);
          expect(data.last).to.match(/^chrY:9872906..9872914,-/);
          expect(data.response[1]).to.be.lte(201803);
          done();
        });
      });

      it('late results', done => {
        run('hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', 'chrY:98', [3 + 1, 201803], done);
      });

      it('with skip, late results', done => {
        run('hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:98', skip: 2}, [1 + 1, 201803], done);
      });

      it('with head, late results', done => {
        run('hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:', head: 100}, 101, done);
      });

      it('with head and skip, late results', done => {
        run('hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', {pattern: 'chrY:', head: 100, skip: 50}, 101, done);
      });

      it('gene lower case', done => {
        run('hg19.cage_peak_phase1and2combined_ann.txt.gz', 'myb', [13 + 1, 201803], done);
      });

      it('gene upper case', done => {
        run('hg19.cage_peak_phase1and2combined_ann.txt.gz', 'MYB', [38 + 1, 201803], done);
      });

      it('entrezgene:3257', done => {
        run('hg19.cage_peak_phase1and2combined_tpm_ann_decoded.osc.txt.gz', 'entrezgene:3257', [1 + 1, 201803], done);
      });
    });
  });

  describe('cut', () => {
    it('should extract correct number of columns, all columns', done => {
      run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chr10:100', [29, 999], (err, data) => {
        expect(err).to.equal(null);
        expect(data.columns).to.equal(896);
        expect(data.header).to.match(/00Annotation/);
        done();
      });
    });

    it('should extract correct number of columns, first 3', done => {
      run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', columns: [0, 1, 2]}, [29, 999], (err, data) => {
        expect(err).to.equal(null);
        expect(data.columns).to.equal(3);
        expect(data.header.split('\t')[0]).to.equal('00Annotation');
        done();
      });
    });

    it('should extract correct number of columns, second 3', done => {
      run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', {pattern: 'chr10:100', columns: [1, 2, 3]}, [29, 999], (err, data) => {
        expect(err).to.equal(null);
        expect(data.columns).to.equal(3);
        expect(data.header.split('\t')[0]).to.equal('short_description');
        done();
      });
    });
  });

  describe('regex', () => {
    it('should match string', done => {
      run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chr10:100', 29, done);
    });

    it.skip('should match string', done => {
      run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', 'chr10:100', 129, done);
    });

    it('should match all on blank', done => {
      run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '', 999, done);
    });

    it('should match with carot', done => {
      run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:100', 29, done);
    });

    it('should match positive strand', done => {
      run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:100\\S*,\\+', 5, done);
    });

    it('should match negitave strand', done => {
      run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:100\\S*,\\-', 25, done);
    });

    it('should match columns', done => {
      run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^\\S*\\s.*chr10:100', 20, done);
    });

    it('should accept explicit or', done => {
      run('hg19.cage_peak_tpm_ann_decoded_head.osc.txt.gz', '^chr10:1000|^chr10:1001', 11, done);
    });
  });
});
