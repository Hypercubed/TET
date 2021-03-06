'use strict';

exports._I = function (line) {
  return line;
};

exports.I = function () {
  return exports._I;
};

exports.F = function (_) {
  return function (line) {
    return line[_];
  };
};

// usage arr.map(exports.split(pattern))
exports.test = function (pattern, inverse) {
  pattern = pattern || '.';
  inverse = inverse || false;

  // var header = '^00';

  if (typeof pattern === 'string') {
    if (pattern === '.') {
      return function () {
        return true;
      };
    }
    pattern = new RegExp(pattern);
    // header = new RegExp(header);
  }

  return function _test(line) {
    return (pattern.test(line) !== inverse);
  };
};

// usage arr.map(exports.cut(pattern))
exports.cut = function (columns, separator) {
  if (!columns) {
    return exports._I;
  }

  const splitter = exports.split(separator);
  const joiner = exports.join(separator);

  const length = columns.length;

  return function _cut(line) {
    if (typeof line !== 'string') {
      line = String(line);
    }

    let index = -1;
    const collection = splitter(line);
    const result = new Array(length);

    while (++index < length) {
      result[index] = collection[columns[index]];
    }
    return joiner(result);
  };
};

// usage arr.map(exports.split(pattern))
exports.split = function (separator) {
  separator = separator || '\t';
  return function split(data) {
    return data.split(separator);
  };
};

// usage arr.map(exports.join(pattern))
exports.join = function (separator) {
  separator = separator || '\t';
  return function _join(data) {
    return data.join(separator);
  };
};
