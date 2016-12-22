let validate = require('./validate')
let last = arr => arr[arr.length-1]
let initial = arr => arr.length ? arr.slice(0, arr.length-1) : []
let extend = require('extend')
let omit = require('lodash.omit')
let EventEmitter = require('events').EventEmitter

module.exports = function (level, opts={ lowPreKeyThreshold: 10 }) {

  let emitter = new EventEmitter()

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

  function update (name, op, validator, item, cb) {
    return level.get(name, function (err, bundle) {
      if (err)
        return cb(err)
      if (!bundle)
        return('Name not found.')
      let valErr = validator(item)
      if (valErr)
        return cb(valErr)
      bundle = op(bundle)
      level.put(name, bundle, cb)
      return
    })
  }

  function fetchPreKeyBundle (name, cb) {
    let b;
    return update(name, function (bundle) {
      // make a presenable bundle for later
      b=bundle
      b.preKey= last(bundle.unsignedPreKeys)
      b = omit(b, 'unsignedPreKeys')
      // now delete that prekey from the db
      bundle.unsignedPreKeys = initial(bundle.unsignedPreKeys)
      // emit 'low-prekeys' event if necessary
      let numRemaining = bundle.unsignedPreKeys.length
      if (numRemaining <= opts.lowPreKeyThreshold)
        emitter.emit('low-prekeys', name, numRemaining)
      return bundle
    }, x => null, null, function (err) {
      if (err)
        cb(err)
      // finally, call back on the presentable bundle we made
      return cb(null, b)
    })
  }

  function replaceSignedPreKey (name, signedPreKey, cb) {
    return update(name, function (bundle) {
      bundle.signedPreKey = signedPreKey
      return bundle
    }, validate.signedPreKey, signedPreKey, cb)
  }

  // TODO validate
  function uploadUnsignedPreKeys (name, prekeys, cb) {
    return update(name, function (bundle) {
      bundle.unsignedPreKeys.push(prekeys)
      return bundle
    }, validate.unsignedPreKeys, prekeys, cb)
  }


  function close (cb) {
    level.close(cb)
  }

  let methods = {
    register: register,
    fetchPreKeyBundle: fetchPreKeyBundle,
    replaceSignedPreKey: replaceSignedPreKey,
    uploadUnsignedPreKeys: uploadUnsignedPreKeys,
    close: close,
  }

  let self = extend(emitter, methods)
  return self
}
