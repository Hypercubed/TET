'use strict';

/*
 * TET Search file API
 */

const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const debug = require('debug')('tet');
const safeRe = require('safe-regex');
const es = require('event-stream');

const extract = require('./extract');

// const __basename = path.basename(__filename);

exports.search = function (_) {
  const root = path.normalize(_ || __dirname);
  // const separator = '\t';

  debug('info', 'Search route using ', root);

  return function (request, response, next) {
    const options = {};  // Extraction options

    function param (key, def) {
      return request.params[key] || request.query[key] || request.body[key] || def;
    }

    // Request options
    const file = param('file', '0') === '1';
    let filename = param('filename') || param('f');

    if (filename === undefined || filename === '') {
      filename = 'index.tsv';
    }
    filename = decodeURI(filename);

    const filepath = options.filename = path.join(root, filename);

    function error(status, msg) {
      msg = msg || 'error';
      const err = new Error(msg);
      err.status = status;
      return next(err);
    }

    // malicious paths
    if (!filename || filename === '') {
      return error(403, 'no file specified!');
    }
    if (filename.indexOf('..') > -1) {
      return error(403, 'not allowed!');
    }
    if (filename.indexOf('/') > -1) {
      return error(403, 'not allowed!');
    }
    if (filename[0] === '.') {
      return error(403, 'not allowed!');
    }
    if (root && filepath.indexOf(root) !== 0) {
      return error(403, 'not allowed!');
    }

    // File exists?
    if (!fs.existsSync(filepath)) {
      return error(404, 'missing file: ' + filename);
    }

    // Search options
    options.pattern = decodeURI(param('search') || param('q', '.'));
    if (options.pattern !== '.') {
      options.pattern = options.pattern.match(/\S+/g).join('|');
    }

    try {
      if (!safeRe(options.pattern)) {
        return error(400, 'Invalid regular expression');
      }
    } catch (err) {
      return error(400, 'Invalid regular expression');
    }

    options.columns = param('columns') || param('c', null);
    options.head = Number(param('head', 1e16));
    options.skip = Number(param('skip', 0));

    debug('debug', 'Searching for ', options.pattern.substring(0, 100), 'in', options.filename, '(head = ', options.head, ')');

    let reader;
    let z;
    // Create stream, need this here so we can call reader.end() on request.connection.once('close')
    if (options.filename.split('.').pop() === 'gz') {
      debug('debug', '\tUnzip mode');
      z = zlib.createGunzip();
      reader = fs.createReadStream(options.filename).pipe(z, {encoding: 'utf8', flags: 'r', fd: null});
    } else {
      reader = fs.createReadStream(options.filename, {encoding: 'utf8', flags: 'r', fd: null});
    }

    /* if (file){
      //response.setHeader('Content-Disposition', 'attachment; filename=table_extraction_results.gz');  // rename base on source
      response.writeHead(200, {
        'Content-encoding': 'gzip',
        'Content-Disposition': 'attachment; filename=test.gz'
      });
      response.connection.setTimeout(15*60*1000, function() {  // 15mins = 15*60*1000
        console.error('timeout');
        debug('debug', 'connection timeout after 15mins');
      });
    } else {
      response.writeHead(200);
    } */

    /* function requestConnectionClose() {
      debug('debug', 'request closed');
      reader.end();
    } */

    // Stop if client has disconnected
    // request.connection.once('close', requestConnectionClose);

    const extractStream = new extract.ExtractStream(options);
    // const lineStream = new byline.LineStream();

    extractStream.on('end', () => {
      debug('debug', 'api extractStream end');
      if (z && z.unpipe) {
        z.unpipe();
      }
      if (reader.unpipe) {
        reader.unpipe();
      }
    });

    if (debug.enabled) {
      if (z) {
        z.on('end', () => {
          debug('debug', 'api zlib end');
        });
      }

      reader.on('end', () => {
        debug('debug', 'api reader end');
      });

      response.on('end', () => {
        debug('debug', 'response end');
      });
    }

    if (file) {
      const resFilename = filename + '.extract.tsv';

      /* response.writeHead(200, {
        'Content-Disposition': 'attachment; filename='+resFilename
      }); */

      response.writeHead(200, {
        'Content-Type': 'application/gzip',
        // 'content-encoding': 'gzip'//,
        'Content-Disposition': 'attachment; filename=' + resFilename + '.gz'
      });

      response.connection.setTimeout(0);

      reader.pipe(es.split())
        .pipe(extractStream)
        .pipe(zlib.createGzip())
        .pipe(response);
    } else {
      response.writeHead(200);

      reader
        .pipe(es.split())
        .pipe(extractStream)
        .pipe(response);
    }
  };
};
