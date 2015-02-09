'use strict';

exports._I = function(line) { return line; };

exports.I = function() { return exports._I; };
exports.F = function(_) { return function(line) { return line[_]; }; };

// usage lazy.filter(exports.grep(pattern))
exports.test = function(pattern, inverse) {
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

exports.cut = function(columns, separator) {
	if (!columns) {return exports._I;}



	var splitter = exports.split(separator);
	var joiner = exports.join(separator);

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

// usage lazy.map(exports.split(pattern))
exports.split = function(separator) {
	separator = separator || '\t';
	return function(data) { return data.split(separator); };
};

// usage lazy.map(exports.join(pattern))
exports.join = function(separator) {
	separator = separator || '\t';
	return function(data) { return data.join(separator); };
};
