### jshint node:true ###
### jshint -W097 ###
'use strict'

Promise = require('bluebird')

retsParsing = require('./retsParsing')
retsHttp = require('./retsHttp')
headersHelper = require('./headers')


###
# Executes RETS login routine.
###

login = (retsSession) ->
  retsHttp.callRetsMethod('login', Promise.promisify(retsSession), {})
  .then (retsResponse) -> new Promise (resolve, reject) ->
    headers = headersHelper.processHeaders(retsResponse.response.rawHeaders)
    systemData =
      retsVersion: headers.retsVersion
      retsServer: headers.server
    
    retsParser = retsParsing.getSimpleParser(reject, headers)
    
    gotData = false
    retsParser.parser.on 'text', (text) ->
      if retsParser.currElementName != 'RETS-RESPONSE'
        return
      gotData = true
      keyVals = text.split('\r\n')
      for keyVal in keyVals
        split = keyVal.split(/\s{0,}=\s{0,}/)
        if split.length > 1
          systemData[split[0]] = split[1]

    retsParser.parser.on 'endElement', (name) ->
      if name != 'RETS'
        return
      retsParser.finish()
      if !gotData
        reject(new Error('Failed to parse data'))
      else
        resolve(systemData)

    retsParser.parser.write(retsResponse.body)
    retsParser.parser.end()


###
# Logouts RETS user
###

logout = (retsSession) ->
  retsHttp.callRetsMethod('logout', Promise.promisify(retsSession), {})


module.exports =
  login: login
  logout: logout
