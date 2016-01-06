### jshint node:true ###
### jshint -W097 ###
'use strict'

Promise = require('bluebird')
through2 = require('through2')

replyCodes = require('../utils/replyCodes')
retsHttp = require('../utils/retsHttp')
retsParsing = require('../utils/retsParsing')


_getMetadataImpl = (retsSession, type, options) -> new Promise (resolve, reject) ->
  context = retsParsing.getStreamParser(type)
  retsHttp.streamRetsMethod('getMetadata', retsSession, options, context.fail, context.response)
  .pipe(context.parser)

  result =
    results: []
    type: type
  currEntry = null

  context.retsStream.pipe through2.obj (event, encoding, callback) ->
    switch event.type
      when 'data'
        currEntry.metadata.push(event.payload)
      when 'metadataStart'
        currEntry =
          info: event.payload
          metadata: []
        result.results.push(currEntry)
      when 'metadataEnd'
        currEntry.info.rowsReceived = event.payload
      when 'headerInfo'
        result.headerInfo = event.payload
      when 'status'
        for own key, value of event.payload
          result[key] = value
      when 'done'
        for own key, value of event.payload
          result[key] = value
        resolve(result)
      when 'error'
        reject(event.payload)
    callback()


###
# Retrieves RETS Metadata.
#
# @param type Metadata type (i.e METADATA-RESOURCE, METADATA-CLASS)
# @param id Metadata id
# @param format Data format (i.e. COMPACT, COMPACT-DECODED), defaults to 'COMPACT'
###

getMetadata = (type, id, format='COMPACT') -> Promise.try () =>
  if !type
    throw new Error('Metadata type is required')
  if !id
    throw new Error('Resource type id is required (or for some types of metadata, "0" retrieves for all resource types)')
  options =
    Type: type
    ID: id
    Format: format
  retsHttp.callRetsMethod('getMetadata', @retsSession, options)


###
# Helper that retrieves RETS system metadata
###

getSystem = () ->
  @getMetadata('METADATA-SYSTEM')
  .then (xmlResponse) -> new Promise (resolve, reject) ->
    result = {}
    retsParser = retsParsing.getSimpleParser(reject, xmlResponse.headerInfo)

    gotMetaDataInfo = false
    gotSystemInfo = false
    retsParser.parser.on 'startElement', (name, attrs) ->
      switch name
        when 'METADATA-SYSTEM'
          gotMetaDataInfo = true
          result.metadataVersion = attrs.Version
          result.metadataDate = attrs.Date
        when 'SYSTEM'
          gotSystemInfo = true
          result.systemId = attrs.SystemID
          result.systemDescription = attrs.SystemDescription

    retsParser.parser.on 'endElement', (name) ->
      if name != 'RETS'
        return
      retsParser.finish()
      if !gotSystemInfo || !gotMetaDataInfo
        reject(new Error('Failed to parse data'))
      else
        resolve(result)
    
    retsParser.parser.write(xmlResponse.body)
    retsParser.parser.end()


module.exports = (_retsSession) ->
  if !_retsSession
    throw new Error('System data not set; invoke login().')
  

  _getParsedMetadataFactory = (type, format='COMPACT') ->
    (id, classType) -> Promise.try () ->
      if !id
        throw new Error('Resource type id is required (or for some types of metadata, "0" retrieves for all resource types)')
      options =
        Type: type
        ID: if classType then "#{id}:#{classType}" else id
        Format: format
      _getMetadataImpl(_retsSession, type, options)
  
  
  _getParsedAllMetadataFactory = (type, format='COMPACT') ->
    options =
      Type: type
      ID: '0'
      Format: format
    () -> _getMetadataImpl(_retsSession, type, options)
  
  
  retsSession: Promise.promisify(_retsSession)
  getMetadata: getMetadata
  getSystem: getSystem
  getResources:       _getParsedMetadataFactory('METADATA-RESOURCE').bind(null, '0')
  getForeignKeys:     _getParsedMetadataFactory('METADATA-FOREIGNKEYS')
  getClass:           _getParsedMetadataFactory('METADATA-CLASS')
  getTable:           _getParsedMetadataFactory('METADATA-TABLE')
  getLookups:         _getParsedMetadataFactory('METADATA-LOOKUP')
  getLookupTypes:     _getParsedMetadataFactory('METADATA-LOOKUP_TYPE')
  getObject:          _getParsedMetadataFactory('METADATA-OBJECT')
  getAllForeignKeys:  _getParsedAllMetadataFactory('METADATA-FOREIGNKEYS')
  getAllClass:        _getParsedAllMetadataFactory('METADATA-CLASS')
  getAllTable:        _getParsedAllMetadataFactory('METADATA-TABLE')
  getAllLookups:      _getParsedAllMetadataFactory('METADATA-LOOKUP')
  getAllLookupTypes:  _getParsedAllMetadataFactory('METADATA-LOOKUP_TYPE')
