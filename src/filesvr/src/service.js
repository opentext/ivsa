#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('./app')
var debug = require('debug')('csr-service:server')
var fs = require('fs')
var jks = require('jks-js')
var http = require('http')
var https = require('https')

require('dotenv').config()

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '5001')
app.set('port', port)

/**
 * Create server.
 */
const keyStorePath = process.env.KEYSTORE_PATH
const keyStorePassword = process.env.KEYSTORE_PASSWORD
let server
if (keyStorePath && keyStorePassword) {
  const keystore = jks.toPem(fs.readFileSync(keyStorePath), keyStorePassword)
  server = https.createServer(keystore[Object.keys(keystore)[0]], app)
} else {
  server = http.createServer(app)
}

console.log(`****************************************************************`)
console.log(`**              ivsa simple file storage service             ***`)
console.log(`****************************************************************`)
console.log(`Server is running ...`)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error('address requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error('address is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address()
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  debug('Listening on ' + bind)
}
