

/*
 * TET Search file API
 */

var path = require('path'),
  fs = require('fs'),
  //Lazy = require('lazy'),
  zlib = require('zlib'),
  debug = require('debug')('tet'),
  extract = require('./extract'),
  safeRe = require('safe-regex')
  ;

var byline = require('byline');

//var __basename = path.basename(__filename);

exports.search = function(_) {
  'use strict';

  var root = path.normalize(_ || __dirname);
  //var separator = '\t';

  debug('info', 'Search route using ', root);

  return function(request, response, next) {

    var options = {};  // Extraction options

    // Request options
    var file = (request.param('file') || '0') === '1';
    var filename = request.param('filename') || request.param('f');

    if (filename === undefined || filename === '') { filename = 'index.tsv'; }
    filename = decodeURI(filename);

    var filepath = options.filename = path.join(root, filename);

    function error(status, msg){
      msg = msg || 'error';
      var err = new Error(msg);
      err.status = status;
      return next(err);
    }

    // malicious paths
    if (!filename || filename === '') {return error(403, 'no file specified!');}
    if (filename.indexOf('..') > -1) {return error(403, 'not allowed!');}
    if (filename.indexOf('/') > -1) {return error(403, 'not allowed!');}
    if (filename[0] === '.') {return error(403, 'not allowed!');}
    if (root && 0 !== filepath.indexOf(root)) {return error(403, 'not allowed!');}

    // File exists?
    if (!fs.existsSync(filepath)) {return error(404, 'missing file');}

    // Search options
    options.pattern = decodeURI(request.param('search') || request.param('q') || '.');
    if (options.pattern !== '.') {
      options.pattern = options.pattern.match(/\S+/g).join('|');
    }

    if (!safeRe(options.pattern)) {return error(403, 'not allowed!');}

    options.columns = request.param('columns') || request.param('c') || null;
    options.head = +(request.param('head') || 1e16);
    options.skip = +(request.param('skip') || 0);

    debug('debug', 'Searching for ', options.pattern.substring(0,100), 'in', options.filename, '(head = ', options.head, ')');

    var reader;
    // Create stream, need this here so we can call reader.end() on request.connection.once('close')
    if (options.filename.split('.').pop() === 'gz') {
      debug('debug', '\tUnzip mode');
      reader = fs.createReadStream(options.filename).pipe(zlib.createGunzip(), {encoding: 'utf8', flags: 'r', fd: null});
    } else {
      reader = fs.createReadStream(options.filename, {encoding: 'utf8', flags: 'r', fd: null});
    }

    if (file){
      response.setHeader('Content-Disposition', 'attachment; filename=table_extraction_results.tsv');
      response.connection.setTimeout(15*60*1000, function() {  // 15mins = 15*60*1000
        console.error('timeout');
        debug('debug', 'connection timeout after 15mins');
      });
    }

    response.writeHead(200);

    function requestConnectionClose() {
      debug('debug', 'request closed');
      reader.end();
    }

    // Stop if client has disconnected
    //request.connection.once('close', requestConnectionClose);

    var extractStream = new extract.ExtractStream(options);
    var lineStream = new byline.LineStream();

    reader.on('end', function() {
      response.end();
      request.connection.removeListener('close', requestConnectionClose);
    });

    response.on('unpipe', function() {
      if (reader.end) {reader.end();}
    });

    reader.pipe(lineStream)
      .pipe(extractStream)
      .pipe(response);

  };

};
