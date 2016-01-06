### jshint node:true ###
### jshint -W097 ###
'use strict'


# need to make a new object as we merge, as we don't want to modify the user's object
mergeOptions = (args...) ->
  if args.length == 0
    return {}
  
  result = {}
  # start at the end, so that values from earlier options objects overwrite and have priority
  for index in [args.length-1..0]
    options = args[index]
    for own key of options
      result[key] = options[key]
  
  result


# default query parameters
_queryOptionsDefaults =
  queryType: 'DMQL2'
  format: 'COMPACT-DECODED'
  count: 1
  standardNames: 0
  restrictedIndicator: '***'
  limit: 'NONE'


normalizeOptions = (queryOptions) ->
  if !queryOptions
    throw new Error('queryOptions is required.')
  if !queryOptions.searchType
    throw new Error('searchType is required (ex: Property')
  if !queryOptions.class
    throw new Error('class is required (ex: RESI)')
  if !queryOptions.query
    throw new Error('query is required (ex: (MatrixModifiedDT=2014-01-01T00:00:00.000+) )')
  merged = mergeOptions(queryOptions, _queryOptionsDefaults)
  transformed = {}
  for own key of merged
    transformed[key[0].toUpperCase() + key.substring(1)] = merged[key]
  transformed

module.exports =
  mergeOptions: mergeOptions
  normalizeOptions: normalizeOptions
