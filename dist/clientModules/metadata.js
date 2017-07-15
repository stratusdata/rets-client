// Generated by CoffeeScript 1.10.0

/* jshint node:true */


/* jshint -W097 */

(function() {
  'use strict';
  var Promise, _getMetadataImpl, getMetadata, getSystem, replyCodes, retsHttp, retsParsing, through2,
    hasProp = {}.hasOwnProperty;

  Promise = require('bluebird');

  through2 = require('through2');

  replyCodes = require('../utils/replyCodes');

  retsHttp = require('../utils/retsHttp');

  retsParsing = require('../utils/retsParsing');

  _getMetadataImpl = function(retsSession, type, options) {
    return new Promise(function(resolve, reject) {
      var context, currEntry, result;
      context = retsParsing.getStreamParser(type);
      retsHttp.streamRetsMethod('getMetadata', retsSession, options, context.fail, context.response).pipe(context.parser);
      result = {
        results: [],
        type: type
      };
      currEntry = null;
      return context.retsStream.pipe(through2.obj(function(event, encoding, callback) {
        var key, ref, ref1, value;
        switch (event.type) {
          case 'data':
            currEntry.metadata.push(event.payload);
            break;
          case 'metadataStart':
            currEntry = {
              info: event.payload,
              metadata: []
            };
            result.results.push(currEntry);
            break;
          case 'metadataEnd':
            currEntry.info.rowsReceived = event.payload;
            break;
          case 'headerInfo':
            result.headerInfo = event.payload;
            break;
          case 'status':
            ref = event.payload;
            for (key in ref) {
              if (!hasProp.call(ref, key)) continue;
              value = ref[key];
              result[key] = value;
            }
            break;
          case 'done':
            ref1 = event.payload;
            for (key in ref1) {
              if (!hasProp.call(ref1, key)) continue;
              value = ref1[key];
              result[key] = value;
            }
            resolve(result);
            break;
          case 'error':
            reject(event.payload);
        }
        return callback();
      }));
    });
  };


  /*
   * Retrieves RETS Metadata.
   *
   * @param type Metadata type (i.e METADATA-RESOURCE, METADATA-CLASS)
   * @param id Metadata id
   * @param format Data format (i.e. COMPACT, COMPACT-DECODED), defaults to 'COMPACT'
   */

  getMetadata = function(type, id, format) {
    if (format == null) {
      format = 'COMPACT';
    }
    return Promise["try"]((function(_this) {
      return function() {
        var options;
        if (!type) {
          throw new Error('Metadata type is required');
        }
        if (!id) {
          throw new Error('Resource type id is required (or for some types of metadata, "0" retrieves for all resource types)');
        }
        options = {
          Type: type,
          ID: id,
          Format: format
        };
        return retsHttp.callRetsMethod('getMetadata', _this.retsSession, options);
      };
    })(this));
  };


  /*
   * Helper that retrieves RETS system metadata
   */

  getSystem = function() {
    return this.getMetadata('METADATA-SYSTEM').then(function(xmlResponse) {
      return new Promise(function(resolve, reject) {
        var gotMetaDataInfo, gotSystemInfo, result, retsParser;
        result = {};
        retsParser = retsParsing.getSimpleParser(reject, xmlResponse.headerInfo);
        gotMetaDataInfo = false;
        gotSystemInfo = false;
        retsParser.parser.on('startElement', function(name, attrs) {
          switch (name) {
            case 'METADATA-SYSTEM':
              gotMetaDataInfo = true;
              result.metadataVersion = attrs.Version;
              return result.metadataDate = attrs.Date;
            case 'SYSTEM':
              gotSystemInfo = true;
              result.systemId = attrs.SystemID;
              return result.systemDescription = attrs.SystemDescription;
          }
        });
        retsParser.parser.on('endElement', function(name) {
          if (name !== 'RETS') {
            return;
          }
          retsParser.finish();
          if (!gotSystemInfo || !gotMetaDataInfo) {
            return reject(new Error('Failed to parse data'));
          } else {
            return resolve(result);
          }
        });
        retsParser.parser.write(xmlResponse.body);
        return retsParser.parser.end();
      });
    });
  };

  module.exports = function(_retsSession) {
    var _getParsedAllMetadataFactory, _getParsedMetadataFactory;
    if (!_retsSession) {
      throw new Error('System data not set; invoke login().');
    }
    _getParsedMetadataFactory = function(type, format) {
      if (format == null) {
        format = 'COMPACT';
      }
      return function(id, classType) {
        return Promise["try"](function() {
          var options;
          if (!id) {
            throw new Error('Resource type id is required (or for some types of metadata, "0" retrieves for all resource types)');
          }
          options = {
            Type: type,
            ID: classType ? id + ":" + classType : id,
            Format: format
          };
          return _getMetadataImpl(_retsSession, type, options);
        });
      };
    };
    _getParsedAllMetadataFactory = function(type, format) {
      var options;
      if (format == null) {
        format = 'COMPACT';
      }
      options = {
        Type: type,
        ID: '0',
        Format: format
      };
      return function() {
        return _getMetadataImpl(_retsSession, type, options);
      };
    };
    return {
      retsSession: Promise.promisify(_retsSession),
      getMetadata: getMetadata,
      getSystem: getSystem,
      getResources: _getParsedMetadataFactory('METADATA-RESOURCE').bind(null, '0'),
      getForeignKeys: _getParsedMetadataFactory('METADATA-FOREIGNKEYS'),
      getClass: _getParsedMetadataFactory('METADATA-CLASS'),
      getTable: _getParsedMetadataFactory('METADATA-TABLE'),
      getLookups: _getParsedMetadataFactory('METADATA-LOOKUP'),
      getLookupTypes: _getParsedMetadataFactory('METADATA-LOOKUP_TYPE'),
      getObject: _getParsedMetadataFactory('METADATA-OBJECT'),
      getAllForeignKeys: _getParsedAllMetadataFactory('METADATA-FOREIGNKEYS'),
      getAllClass: _getParsedAllMetadataFactory('METADATA-CLASS'),
      getAllTable: _getParsedAllMetadataFactory('METADATA-TABLE'),
      getAllLookups: _getParsedAllMetadataFactory('METADATA-LOOKUP'),
      getAllLookupTypes: _getParsedAllMetadataFactory('METADATA-LOOKUP_TYPE')
    };
  };

}).call(this);