'use strict';

// Extract data from text file
var fs = require('fs'),
		zlib = require('zlib'),
		es = require('event-stream');

var lazyHelper = require('../tsvStreamHelper.js');

// Creates a new extract-stream-transformer
var ExtractStream = exports.ExtractStream = function ExtractStream(options) {

	options = options || {};

	options.pattern = options.pattern || '.';
	options.columns = options.columns || null;
	options.head = (typeof options.head !== 'undefined') ? options.head : null;   // Todo: Not this.
	options.skip = (typeof options.skip !== 'undefined') ? options.skip : 0;

	if (options.columns && !Array.isArray(options.columns)) {   // Make sure we are getting an array of columns
		options.columns = [options.columns];
	}

	var grepFilter = lazyHelper.test(options.pattern);
	var grepHeader = lazyHelper.test('^##|^0[1-9]');
	var cutLine = lazyHelper.cut(options.columns);

	var transformer = es.map(function(line, callback){
		if (grepHeader(line)) { return callback(); }
		if (transformer.tcount++ === 0 || grepFilter(line)) {												// Header or matching line
			if (options.head !== null && transformer.count > options.head) {					// Unpipe if past the desiered number of lines
				transformer.end();
				return callback();
			}
			if (transformer.count++ === -options.skip || transformer.count > 1) {				// Count results and skip desiered number of lines
				if (line === '') { return callback(); }
				return callback(null, cutLine(line)+'\n');
			}
		}
		return callback();
	});

	//console.log(transformer);

	/* var transformer = transform(function(line, callback){
	  if (grepHeader(line)) {return callback(null, null);}
	  if (transformer.tcount++ === 0 || grepFilter(line)) {												// Header or matching line
			if (options.head !== null && transformer.count > options.head) {					// Unpipe if past the desiered number of lines
				transformer.unpipe();
				return null;
			}
			if (transformer.count++ === -options.skip || transformer.count > 1) {				// Count results and skip desiered number of lines
				return callback(null, cutLine(line)+'\n');			// Write response
			}
	  }
	  return callback(null, null);
	}); */

	transformer.count = -options.skip;
	transformer.tcount = 0;

	return transformer;
};

// convenience API
exports.search = function(reader, writer, options, callback) {  // Todo: remove this?

	if (typeof reader === 'string') {
		if (reader.split('.').pop() === 'gz') {
			reader = fs.createReadStream(reader).pipe(zlib.createGunzip(), {encoding: 'utf8', flags: 'r', fd: null});
		} else {
			reader = fs.createReadStream(reader, {encoding: 'utf8', flags: 'r', fd: null});
		}
	}

	var extract = new ExtractStream(options);
	//var lineStream = new byline.LineStream();

	reader.on('end', function() {
		//console.log('reader end');
		if (callback) {
			callback(null, [ extract.count, extract.tcount ]);
		}
	});

	extract.on('end', function() {
		//console.log('extract end');
		if (reader.end) {reader.end();}
	});

	reader
		.pipe(es.split())
		.pipe(extract)
		.pipe(writer);

};
