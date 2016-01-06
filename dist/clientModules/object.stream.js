// Generated by CoffeeScript 1.10.0

/* jshint node:true */


/* jshint -W097 */

(function() {
  'use strict';
  var Promise, _annotateIds, _insensitiveStartsWith, _processBody, base64, getAllObjects, getObjects, getPreferredObjects, headersHelper, multipart, queryOptionHelpers, retsHttp, retsParsing, through2;

  Promise = require('bluebird');

  through2 = require('through2');

  base64 = require('base64-stream');

  retsHttp = require('../utils/retsHttp');

  retsParsing = require('../utils/retsParsing');

  queryOptionHelpers = require('../utils/queryOptions');

  multipart = require('../utils/multipart');

  headersHelper = require('../utils/headers');

  _insensitiveStartsWith = function(str, prefix) {
    return str.toLowerCase().lastIndexOf(prefix.toLowerCase(), 0) === 0;
  };

  _processBody = function(headers, bodyStream, preDecoded) {
    return new Promise(function(resolve, reject) {
      var b64, headerInfo, onError, ref, retsParser;
      headerInfo = headersHelper.processHeaders(headers);
      if (_insensitiveStartsWith(headerInfo.contentType, 'text/xml')) {
        onError = function(error) {
          return reject({
            headerInfo: headerInfo,
            error: error
          });
        };
        retsParser = retsParsing.getSimpleParser(onError, headerInfo);
        return bodyStream.pipe(retsParser.parser);
      } else if (_insensitiveStartsWith(headerInfo.contentType, 'multipart')) {
        return multipart.getObjectStream(headerInfo, bodyStream, _processBody).then(function(objectStream) {
          return resolve({
            headerInfo: headerInfo,
            objectStream: objectStream
          });
        })["catch"](function(error) {
          return reject({
            headerInfo: headerInfo,
            error: error
          });
        });
      } else {
        if (preDecoded || ((ref = headerInfo.transferEncoding) === 'binary' || ref === '7bit' || ref === '8bit' || ref === (void 0))) {
          return resolve({
            headerInfo: headerInfo,
            dataStream: bodyStream
          });
        } else if (headerInfo.transferEncoding === 'base64') {
          b64 = base64.decode();
          bodyStream.on('error', function(err) {
            return b64.emit('error', err);
          });
          return resolve({
            headerInfo: headerInfo,
            dataStream: bodyStream.pipe(b64)
          });
        } else {
          return resolve({
            headerInfo: headerInfo,
            error: new Error("unknown transfer encoding: " + (JSON.stringify(headerInfo.transferEncoding)))
          });
        }
      }
    });
  };

  _annotateIds = function(ids, suffix) {
    var annotatedIds, i, id, len;
    if (typeof ids === 'string') {
      annotatedIds = ids + ":" + suffix;
    } else if (Array.isArray(ids)) {
      annotatedIds = [];
      for (i = 0, len = ids.length; i < len; i++) {
        id = ids[i];
        annotatedIds.push(id + ":" + suffix);
      }
    }
    return annotatedIds;
  };


  /*
   * All methods below take the following parameters:
   *    resourceType: resource type (RETS Resource argument, ex: Property)
   *    objectType: object type (RETS Type argument, ex: Photo)
   *    ids: the ids of the objects to query, corresponding to the RETS ID argument; you really should know the RETS
   *       standard to fully understand every possibility here.  (See the individual method descriptions below.)  Can be
   *       one of 3 data types:
   *       1. string: will use this literal value as the ID argument
   *       2. array: will be joined with commas, then used as the ID argument
   *       3. object: (valid for getObjects only) keys will be joined to values with a colon, and if a value is an array
   *           it will be joined with colons
   *    options: object of additional options.
   *       Location: can be 0 (default) or 1; a 1 value requests URLs be returned instead of actual image data, but the
   *           RETS server may ignore this
   *       ObjectData: can be null (default), a string to be used directly as the ObjectData argument, or an array of
   *           values to be joined with commas.  Requests that the server sets headers containing additional metadata
   *           about the object(s) in the response.  The special value '*' requests all available metadata.  Any headers
   *           set based on this argument will be parsed into a special object and set as the field 'objectData' in the
   *           headerInfo object.
   *       alwaysGroupObjects: can be false (default) or true.  If true, all of the methods below will return a result
   *           formatted as if a multipart response was received, even if a request only returns a single result.  If you
   *           will sometimes get multiple results back from a single query, this will simplify your code by making the
   *           results more consistent.  However, if you know you are only making requests that return a single result,
   *           it is probably more intuitive to leave this false/unset.
   *
   * Depending on the form of the response from the RETS server, all methods below will resolve or reject as follows:
   * 1. If the HTTP response is not a 200/OK message, all methods will reject with a RetsServerError.
   * 2. If the HTTP response is a 200/OK message, but the contentType is text/xml, all methods will reject with a
   *    RetsReplyError.
   * 3. If the HTTP response is a 200/OK message with a non-multipart contentType, and if the alwaysGroupObjects option is
   *    not set, then the response is treated as a single-object response, and all methods will resolve to an object with
   *    the following fields:
   *       headerInfo: an object of metadata from the headers of the response
   *       dataStream: a stream of the object's data
   * 4. If the HTTP response is a 200/OK message with a multipart contentType, or if the alwaysGroupObjects option is set,
   *    then all methods will resolve to an object with the following fields:
   *       headerInfo: an object of metadata from the headers of the main response
   *       objectStream: a stream of objects corresponding to the parts of the response; each object will have its own
              headerInfo field for the headers on its part, and either an error field or a dataStream field.
   */


  /*
   * getObjects: Use this if you need to specify exactly what images/objects to retrieve.  `ids` can be a single string,
   *     an array, or an object.  This is the only method that lets you specify object UIDs instead of resourceIds.
   */

  getObjects = function(resourceType, objectType, ids, _options) {
    if (_options == null) {
      _options = {};
    }
    return Promise["try"]((function(_this) {
      return function() {
        var alwaysGroupObjects, idArray, idString, mainOptions, objectIds, options, resourceId;
        if (!resourceType) {
          throw new Error('Resource type id is required');
        }
        if (!objectType) {
          throw new Error('Object type id is required');
        }
        if (!ids) {
          throw new Error('Ids are required');
        }
        idString = '';
        if (typeof ids === 'string') {
          idString = ids;
        } else if (Array.isArray(ids)) {
          idString = ids.join(',');
        } else {
          idArray = [];
          for (resourceId in ids) {
            objectIds = ids[resourceId];
            if (Array.isArray(objectIds)) {
              objectIds = objectIds.join(':');
            }
            if (objectIds) {
              idArray.push(resourceId + ":" + objectIds);
            } else {
              idArray.push(resourceId);
            }
          }
          idString = idArray.join(',');
        }
        mainOptions = {
          Type: objectType,
          Resource: resourceType,
          ID: idString
        };
        options = queryOptionHelpers.mergeOptions(mainOptions, _options, {
          Location: 0
        });
        if (Array.isArray(options.ObjectData)) {
          options.ObjectData = options.ObjectData.join(',');
        }
        alwaysGroupObjects = !!options.alwaysGroupObjects;
        delete options.alwaysGroupObjects;
        return new Promise(function(resolve, reject) {
          var bodyStream, done, fail, req;
          done = false;
          fail = function(error) {
            if (done) {
              return;
            }
            done = true;
            return reject(error);
          };
          req = retsHttp.streamRetsMethod('getObject', _this.retsSession, options, fail);
          req.on('error', fail);
          req.on('response', function(response) {
            if (done) {
              return;
            }
            done = true;
            return resolve(_processBody(response.rawHeaders, bodyStream, true));
          });
          return bodyStream = req.pipe(through2());
        }).then(function(result) {
          var wrappedResult;
          if (result.objectStream || !alwaysGroupObjects) {
            return result;
          }
          wrappedResult = {
            headerInfo: result.headerInfo,
            objectStream: through2.obj()
          };
          wrappedResult.objectStream.write(result);
          wrappedResult.objectStream.end();
          return wrappedResult;
        });
      };
    })(this));
  };


  /*
   * getAllObjects: Use this if you want to get all associated images/objects for all resources (i.e. listingIds or
   *     agentIds) specified.  `ids` can be a single string or an array; a ':*' suffix is appended to each id.
   */

  getAllObjects = function(resourceType, objectType, ids, options) {
    return this.getObjects(resourceType, objectType, _annotateIds(ids, '*'), options);
  };


  /*
   * getPreferredObjects: Use this if you want to get a single 'preferred' image/object for each resource (i.e. listingId
   *  or agentIds) specified.  `ids` can be a single string or an array; a ':0' suffix is appended to each id.
   */

  getPreferredObjects = function(resourceType, objectType, ids, options) {
    return this.getObjects(resourceType, objectType, _annotateIds(ids, '0'), options);
  };

  module.exports = function(_retsSession) {
    if (!_retsSession) {
      throw new Error('System data not set; invoke login().');
    }
    return {
      retsSession: _retsSession,
      getObjects: getObjects,
      getAllObjects: getAllObjects,
      getPreferredObjects: getPreferredObjects
    };
  };

}).call(this);
