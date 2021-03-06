// Generated by CoffeeScript 1.10.0

/* jshint node:true */


/* jshint -W097 */

(function() {
  'use strict';
  var RetsReplyError, RetsServerError, headersHelper, replyCodes,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  replyCodes = require('./replyCodes');

  headersHelper = require('./headers');

  RetsReplyError = (function(superClass) {
    extend(RetsReplyError, superClass);

    function RetsReplyError(replyCode, replyText, _headerInfo) {
      this.replyCode = replyCode;
      this.replyText = replyText;
      this.name = 'RetsReplyError';
      this.replyTag = replyCodes.tagMap[this.replyCode] != null ? replyCodes.tagMap[this.replyCode] : 'unknown reply code';
      this.message = "RETS Server replied with an error code - ReplyCode " + this.replyCode + " (" + this.replyTag + "); ReplyText: " + this.replyText;
      this.headerInfo = headersHelper.processHeaders(_headerInfo);
      Error.captureStackTrace(this, RetsReplyError);
    }

    return RetsReplyError;

  })(Error);

  RetsServerError = (function(superClass) {
    extend(RetsServerError, superClass);

    function RetsServerError(retsMethod, httpStatus, httpStatusMessage, _headerInfo) {
      this.retsMethod = retsMethod;
      this.httpStatus = httpStatus;
      this.httpStatusMessage = httpStatusMessage;
      this.name = 'RetsServerError';
      this.message = "Error while attempting " + this.retsMethod + " - HTTP Status " + this.httpStatus + " returned (" + this.httpStatusMessage + ")";
      this.headerInfo = headersHelper.processHeaders(_headerInfo);
      Error.captureStackTrace(this, RetsServerError);
    }

    return RetsServerError;

  })(Error);

  module.exports = {
    RetsReplyError: RetsReplyError,
    RetsServerError: RetsServerError
  };

}).call(this);
