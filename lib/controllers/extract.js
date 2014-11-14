// Extract data from text file
var fs = require('fs'),
		zlib = require('zlib'),
		byline = require('byline'),
		transform = require('stream-transform');

function LazyHelper() {
	'use strict';

	var lazyHelper = {};

	lazyHelper._I = function(line) { return line; };

	lazyHelper.I = function() { return lazyHelper._I; };
	lazyHelper.F = function(_) { return function(line) { return line[_]; }; };

	// usage lazy.filter(lazyHelper.grep(pattern))
	lazyHelper.test = function(pattern, inverse) {
		pattern = pattern || '.';
		inverse = inverse || false;

		//var header = '^00';

		if (typeof pattern === 'string') {
			if (pattern === '.') {return function() { return true; };}
			pattern =  new RegExp(pattern);
			//header = new RegExp(header);
		}

		return function (line) { return (pattern.test(line) !== inverse); };
		//return function (line) { return (pattern.test(line) !== inverse) || (header.test(line)); };
	};

	lazyHelper.cut = function(columns, separator) {
		if (!columns) {return lazyHelper._I;}



		var splitter = lazyHelper.split(separator);
		var joiner = lazyHelper.join(separator);

		var length = columns.length;

		return function _cut(line) {
			if(typeof line !== 'string') { line = String(line); }
			var index = -1,
					collection = splitter(line),
					result = new Array(length);

	    while(++index < length) {
	      result[index] = collection[columns[index]];
	    }
	    return joiner(result);
		};
	};

	// usage lazy.map(lazyHelper.split(pattern))
	lazyHelper.split = function(separator) {
		separator = separator || '\t';
		return function(data) { return data.split(separator); };
	};

	// usage lazy.map(lazyHelper.join(pattern))
	lazyHelper.join = function(separator) {
		separator = separator || '\t';
		return function(data) { return data.join(separator); };
	};

	/*
	lazyHelper.length = function() {
		return function(data) { return data.length; };
	};

	lazyHelper.wc = function(_) {
		var separator = lazyHelper.split(_ || '\t');
		return function(data) { return separator(data).length; };
	};

	lazyHelper.format = function(_) {
		if (_ === 'json'){
			return JSON.stringify;
		}

		if (_ === 'csv'){
			return lazyHelper.join(',');
		}

		if (_ === 'tsv'){
			return lazyHelper.join('\t');
		}

		//if (_ === 'jsv'){
		//	return lazyHelper.join('J');
		//}

		if (_ === 'html'){
			return lazyHelper.join('</td><td>');
		}

		return lazyHelper.join('');
	};

	lazyHelper.converter = function converter(separator, format) {
		format = format || 'text';

		if (format === 'text' || format === 'raw'){
			return function(line) { return line; };
		}

		var splitter = lazyHelper.split(separator || '\t');
		var formattor = lazyHelper.format(format || 'text');

		return function(line) {
			return formattor(splitter(line));
		};
	};

	*/

	return lazyHelper;

}

// Creates a new extract-stream-transformer
var ExtractStream = exports.ExtractStream = function ExtractStream(options) {
	'use strict';

	options = options || {};

	options.pattern = options.pattern || '.';
	options.columns = options.columns || null;
	options.head = (typeof options.head !== 'undefined') ? options.head : null;   // Todo: Not this.
	options.skip = (typeof options.skip !== 'undefined') ? options.skip : 0;

	if (options.columns && !Array.isArray(options.columns)) {   // Make sure we are getting an array of columns
		options.columns = [options.columns];
	}

	var lh = new LazyHelper();
	var grepFilter = lh.test(options.pattern);
	var grepHeader = lh.test('^##|^0[1-9]');
	var cutLine = lh.cut(options.columns);

	var transformer = transform(function(line, callback){
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
	});

	transformer.count = -options.skip;
	transformer.tcount = 0;

	return transformer;
};

// convenience API
exports.search = function(reader, writer, options, callback) {  // Todo: remove this?
	'use strict';

	if (typeof reader === 'string') {
		if (reader.split('.').pop() === 'gz') {
			reader = fs.createReadStream(reader).pipe(zlib.createGunzip(), {encoding: 'utf8', flags: 'r', fd: null});
		} else {
			reader = fs.createReadStream(reader, {encoding: 'utf8', flags: 'r', fd: null});
		}
	}

	var extract = new ExtractStream(options);
	var lineStream = new byline.LineStream();

	reader.on('end', function() {
		if (callback) {
			callback(null, [ extract.count, extract.tcount ]);
		}
	});

	writer.on('unpipe', function() {
		if (reader.end) {reader.end();}
	});

	reader
		.pipe(lineStream)
		.pipe(extract)
		.pipe(writer);

};
