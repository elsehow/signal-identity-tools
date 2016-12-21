var validate = require('./validate')
var db = {}
function register (name, publicIdentity, cb) {
  // TODO validate that name is unique
  if (db[name])
    return cb('That name is taken')
  let err = validate(publicIdentity)
  if (!err) {
    db[name] = publicIdentity
    return cb(null, name)
  }
  return cb(err)
}
// TODO multiple unsigned prekeys
function fetchPreKeyBundle (name, cb) {
  let bundle = db[name]
  // bundle.preKey = bundle.unsignedPreKeys[0]
  // delete(bundle['unsignedPreKeys'])
  // console.log(bundle)
  cb(null, bundle)
}
function close (path, cb) {
  close()
}
module.exports = function (path) {
  // TODO setup db against path
  return {
    register: register,
    fetchPreKeyBundle: fetchPreKeyBundle,
    close: (cb) => close(path, cb),
  }
}
