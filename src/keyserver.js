let validate = require('./validate')
let last = arr => arr[arr.length-1]
let initial = arr => arr.length ? arr.slice(0, arr.length-1) : []
let extend = require('extend')
let omit = require('lodash.omit')
let EventEmitter = require('events').EventEmitter

module.exports = function (level, opts={ lowPreKeyThreshold: 10 }) {

  let emitter = new EventEmitter()

  function register (name, publicIdentity, cb) {
    return level.get(name, function (err, value) {
      if (err && err.type !== 'NotFoundError')
        return cb(err)
      if (value)
        return cb('Name already taken.')
      // validate the submitted id
      validate.publicId(publicIdentity, function (valErr) {
        if (valErr)
          return cb(valErr)
        return level.put(name, publicIdentity, cb)
      })
    })
  }

  function update (name, op, validator, item, cb) {
    return level.get(name, function (err, bundle) {
      if (err)
        return cb(err)
      if (!bundle)
        return('Name not found.')
      op(bundle)
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
      cb(null, bundle)
    })
  }

  function replaceSignedPreKey (name, signedPreKey, cb) {
    // TODO this validator should check the signedPreKey against the bundle.identityKey
    //      what's an easy, interoperable way to make this work?
    //      use bundle form the callback perhaps?
    return update(name, function (bundle) {
      let idPubKey = bundle.identityKey
      validate.signedPreKey(idPubKey, signedPreKey, function (valErr) {
        if (valErr)
          return cb(valErr)
        bundle.signedPreKey = signedPreKey
        level.put(name, bundle, cb)
      })
    })
  }

  // TODO validate
  function uploadUnsignedPreKeys (name, prekeys, cb) {
    let valErr = validate.unsignedPreKeys(prekeys)
    if (valErr)
      return cb(valErr)
    return update(name, function (bundle) {
      bundle.unsignedPreKeys.push(prekeys)
      cb()
    }, cb)
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
