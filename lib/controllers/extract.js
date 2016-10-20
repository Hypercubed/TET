'use strict';

// Extract data from text file
const fs = require('fs');
const zlib = require('zlib');
const es = require('event-stream');
const through2 = require('through2');
const debug = require('debug')('tet');

const lazyHelper = require('../tsv-stream-helper.js');

// Creates a new extract-stream-transformer
const ExtractStream = exports.ExtractStream = function ExtractStream(options) {
  options = options || {};

  options.pattern = options.pattern || '.';
  options.columns = options.columns || null;
  options.head = (typeof options.head === 'undefined') ? null : Number(options.head);   // Todo: Not this.
  options.skip = (typeof options.skip === 'undefined') ? 0 : Number(options.skip);

  if (options.columns && !Array.isArray(options.columns)) {   // Make sure we are getting an array of columns
    options.columns = [options.columns];
  }

  const grepFilter = lazyHelper.test(options.pattern);
  const grepHeader = lazyHelper.test('^##|^0[1-9]');
  const cutLine = lazyHelper.cut(options.columns);

  /* const transformer = es.mapSync(function(line){
    line = line.toString();
    if (!grepHeader(line)) {
      if (transformer.tcount++ === 0 || grepFilter(line)) {                        // Header or matching line
        if (options.head !== null && transformer.count > options.head) {          // Unpipe if past the desired number of lines
          transformer.emit('end');
        } else if (transformer.count++ === -options.skip || transformer.count > 1) {        // Count results and skip desired number of lines
          if (line !== '') {
            transformer.emit('data', cutLine(line)+'\n');
          }
        }
      }
    }
  }); */

  const transformer = through2((line, enc, callback) => {
    line = line.toString();
    if (!grepHeader(line)) {
      if (transformer.tcount++ === 0 || grepFilter(line)) {                        // Header or matching line
        if (options.head !== null && transformer.count > options.head) {           // Unpipe if past the desired number of lines
          transformer.push(null);
          // this.emit('end');
        } else if (transformer.count++ === -options.skip || transformer.count > 1) {        // Count results and skip desired number of lines
          if (line !== '') {
            transformer.push(cutLine(line) + '\n');
          }
        }
      }
    }
    callback();
  });

  transformer.count = -options.skip;
  transformer.tcount = 0;

  return transformer;
};

// convenience API
exports.search = function (reader, writer, options, callback) {  // Todo: remove this?
  let z;
  if (typeof reader === 'string') {
    if (reader.split('.').pop() === 'gz') {
      z = zlib.createGunzip();
      reader = fs.createReadStream(reader).pipe(z, {encoding: 'utf8', flags: 'r', fd: null});
    } else {
      reader = fs.createReadStream(reader, {encoding: 'utf8', flags: 'r', fd: null});
    }
  }

  const extract = new ExtractStream(options);
  // const lineStream = new byline.LineStream();

  reader.on('end', () => {
    debug('info', 'search reader end');
    if (callback) {
      callback(null, [extract.count, extract.tcount]);
      callback = null;
    }
  });

  extract.on('end', () => {
    debug('info', 'search extract end');
    if (z && z.unpipe) {
      z.unpipe();
    }
    if (reader.unpipe) {
      reader.unpipe();
    }
    if (callback) {
      callback(null, [extract.count, extract.tcount]);
      callback = null;
    }
  });

  reader
    .pipe(es.split())
    .pipe(extract)
    .pipe(writer);
};
