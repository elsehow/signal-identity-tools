var validate = require('./validate')
var last = arr => arr[arr.length-1]
var initial = arr => arr.length ? arr.slice(0, arr.length-1) : []
var omit = require('lodash.omit')

module.exports = function (level) {

  // TODO setup db against path
  var db = {}

  function register (name, publicIdentity, cb) {
    // TODO we could verify public identity with signatures ?
    //      https://github.com/elsehow/signal-protocol/blob/master/src/SessionBuilder.js#L23
    return level.get(name, function (err, value) {
      if (err && err.type !== 'NotFoundError')
        return cb(err)
      if (value)
        return cb('Name already taken.')
      // validate the submitted id
      let valErr = validate.publicId(publicIdentity)
      if (valErr)
        return cb(valErr)
      return level.put(name, publicIdentity, cb)
    })
  }

  function fetchPreKeyBundle (name, cb) {
    return level.get(name, function (err, bundle) {
      if (err)
        return cb(err)
      if (!bundle)
        return('Name not found.')
      // pick last prekey for the bundle
      let thisPreKey = last(bundle.unsignedPreKeys)
      // now delete that prekey from the db
      bundle.unsignedPreKeys = initial(bundle.unsignedPreKeys)
      level.put(name, bundle, function (err, _) {
        if (err)
          return cb(err)
        // finally, call back on this bundle, plus preKey
        bundle.preKey = thisPreKey
        // and minus unsigned pre keys
        return cb(null, omit(bundle, 'unsignedPreKeys'))
      })
    })
  }

  function replaceSignedPreKey (name, signedPreKey, cb) {
    return level.get(name, function (err, bundle) {
      if (err)
        return cb(err)
      if (!bundle)
        return('Name not found.')
      let valErr = validate.signedPreKey(signedPreKey)
      if (valErr)
        return cb(valErr)
      bundle.signedPreKey = signedPreKey
      level.put(name, bundle, cb)
      return
    })
  }

  // TODO validate
  function uploadUnsignedPreKeys (name, prekeys, cb) {
    return level.get(name, function (err, bundle) {
      if (err)
        return cb(err)
      if (!bundle)
        return('Name not found.')
      bundle.unsignedPreKeys.push(prekeys)
      level.put(name, bundle, cb)
    })
  }


  function close (cb) {
    level.close(cb)
  }

  return {
    register: register,
    fetchPreKeyBundle: fetchPreKeyBundle,
    replaceSignedPreKey: replaceSignedPreKey,
    uploadUnsignedPreKeys: uploadUnsignedPreKeys,
    close: close,
  }
}
