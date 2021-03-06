// Generated by CoffeeScript 1.10.0

/* jshint node:true */


/* jshint -W097 */

(function() {
  'use strict';
  var _queryOptionsDefaults, mergeOptions, normalizeOptions,
    slice = [].slice,
    hasProp = {}.hasOwnProperty;

  mergeOptions = function() {
    var args, i, index, key, options, ref, result;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (args.length === 0) {
      return {};
    }
    result = {};
    for (index = i = ref = args.length - 1; ref <= 0 ? i <= 0 : i >= 0; index = ref <= 0 ? ++i : --i) {
      options = args[index];
      for (key in options) {
        if (!hasProp.call(options, key)) continue;
        result[key] = options[key];
      }
    }
    return result;
  };

  _queryOptionsDefaults = {
    queryType: 'DMQL2',
    format: 'COMPACT-DECODED',
    count: 1,
    standardNames: 0,
    restrictedIndicator: '***',
    limit: 'NONE'
  };

  normalizeOptions = function(queryOptions) {
    var key, merged, transformed;
    if (!queryOptions) {
      throw new Error('queryOptions is required.');
    }
    if (!queryOptions.searchType) {
      throw new Error('searchType is required (ex: Property');
    }
    if (!queryOptions["class"]) {
      throw new Error('class is required (ex: RESI)');
    }
    if (!queryOptions.query) {
      throw new Error('query is required (ex: (MatrixModifiedDT=2014-01-01T00:00:00.000+) )');
    }
    merged = mergeOptions(queryOptions, _queryOptionsDefaults);
    transformed = {};
    for (key in merged) {
      if (!hasProp.call(merged, key)) continue;
      transformed[key[0].toUpperCase() + key.substring(1)] = merged[key];
    }
    return transformed;
  };

  module.exports = {
    mergeOptions: mergeOptions,
    normalizeOptions: normalizeOptions
  };

}).call(this);
