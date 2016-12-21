var validate = require('./validate')
var last = arr => arr[arr.length-1]
var initial = arr => arr.slice(0, arr.length-1)

module.exports = function (path) {

  // TODO setup db against path
  var db = {}

  function register (name, publicIdentity, cb) {
    // validate that name is unique
    if (db[name])
      return cb('That name is taken')
    let err = validate.publicId(publicIdentity)
    if (!err) {
      db[name] = publicIdentity
      return cb(null, name)
    }
    return cb(err)
  }

  function fetchPreKeyBundle (name, cb) {
    let bundle = db[name]
    // pick last prekey for the bundle
    bundle.preKey = last(bundle.unsignedPreKeys)
    // now delete that prekey from the db
    db[name].unsignedPreKeys = initial(db[name].unsignedPreKeys)
    // remove other prekeys from the bundle
    delete(bundle['unsignedPreKeys'])
    cb(null, bundle)
  }

  function replaceSignedPreKey (name, signedPreKey, cb) {
    if (!db[name])
      cb('Name not found.')
    db[name].signedPreKey = signedPreKey
    cb(null, name)
  }

  function close (path, cb) {
    close()
  }

  return {
    register: register,
    fetchPreKeyBundle: fetchPreKeyBundle,
    replaceSignedPreKey: replaceSignedPreKey,
    close: (cb) => close(path, cb),
  }
}
