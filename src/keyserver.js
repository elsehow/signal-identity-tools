var validate = require('./validate')
var last = arr => arr[arr.length-1]
var initial = arr => arr.length ? arr.slice(0, arr.length-1) : []
var omit = require('lodash.omit')

module.exports = function (level) {

  // TODO setup db against path
  var db = {}

  function register (name, publicIdentity, cb) {
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
    if (!db[name])
      return cb('Name not found.')
    db[name].signedPreKey = signedPreKey
    cb(null, name)
  }

  function uploadUnsignedPreKeys (name, prekeys, cb) {
    if (!db[name])
      return cb('Name not found.')
    db[name].unsignedPreKeys.push(prekeys)
    return cb(null, name)
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
