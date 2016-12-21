var extend = require('xtend')
var store = require('./src/levelSignalStore')
var idtools = require('./src/idtools')
var partial = require('lodash.partial')
var signal = require('signal-protocol')

module.exports = (level) => {
  let s = store(level)
  let r = extend(s,idtools)
  let partialStore = (obj, prop) => {
    obj[prop] = partial(obj[prop], s)
  }

  // TODO move these into core lib
  function sessionBuilder (theirName, theirKeyId) {
    // now, bob can build a session cipher with which he can speak to alice
    var addr = new signal.SignalProtocolAddress(theirName, theirKeyId)
    var builder = new signal.SessionBuilder(s, addr)
    return builder
  }
  function sessionCipher (theirName, theirKeyId) {
    var addr = new signal.SignalProtocolAddress(theirName, theirKeyId)
    var cipher = new signal.SessionCipher(s, addr);
    return cipher
  }

  partialStore(r,'freshIdentity')
  partialStore(r,'newSignedPreKey')
  r.sessionBuilder = sessionBuilder
  r.sessionCipher = sessionCipher

  return r
}
