let signal = require('signal-protocol')
let KeyHelper = signal.KeyHelper;
let last = arr => arr[arr.length-1]

function uuid () {
  return signal.KeyHelper.generateRegistrationId()
}

/*
  elsehow 12/21/16
  berkeley


  these methods call back on an object

  { complete, sanitized, store }

  `complete` includes secret keys

  `sanitized` is safe to send to keyserver

*/

module.exports = {
  freshIdentity: freshIdentity,
  newSignedPreKey: newSignedPreKey,
  // this one does not call back on `store`
  // - it doesn't need a store
  newUnsignedPreKeys: newUnsignedPreKeys,
}

function unsignedPreKeysPromise (n) {
  let ps = []
  for (let i=0;i<n;i++)
    ps.push(KeyHelper.generatePreKey(uuid()))
  return Promise.all(ps)
}

function cleanUnsigned (preKey) {
  return {
    keyId: preKey.keyId,
    publicKey: preKey.keyPair.pubKey,
  }
}

function cleanSigned (preKey) {
  return {
    keyId: preKey.keyId,
    publicKey: preKey.keyPair.pubKey,
    signature: preKey.signature
  }
}

function sanitize (identity) {
  return {
    registrationId: identity.registrationId,
    identityKey: identity.identityKeyPair.pubKey,
    signedPreKey: cleanSigned(identity.signedPreKey),
    unsignedPreKeys: identity.unsignedPreKeys.map(cleanUnsigned),
    // preKey: cleanUnsigned(identity.preKey)
  }
}

function freshIdentity (store, keyId, cb, opts={ nUnsignedPreKeys: 10 }) {

  let registrationId = KeyHelper.generateRegistrationId()
  let identity = {
    registrationId: registrationId,
    identityKeyPair: null,
    unsignedPreKeys: [],
    signedPreKey: null,
  }

  let preKeysP =  unsignedPreKeysPromise(opts.nUnsignedPreKeys)
      .then((preKeys) => {
        identity.unsignedPreKeys = preKeys
        // save the last one in the store
        preKeys.forEach(function (preKey) {
          return store.storePreKey(preKey.keyId, preKey.keyPair);
        })
      })
  let identityKeyP = KeyHelper.generateIdentityKeyPair()
      .then((idKp) => {
        identity.identityKeyPair = idKp
        return Promise.all([
          store.put('identityKey', idKp),
          KeyHelper.generateSignedPreKey(idKp, keyId)
        ])
      }).then((res) => {
        let signedPreKey = res[1]
        identity.signedPreKey = signedPreKey
        return store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair)
      })

  Promise.all([
    store.put('registrationId', registrationId),
    preKeysP,
    identityKeyP,
  ]).then((_) => {
    let r = {
      complete: identity,
      sanitized: sanitize(identity),
      store: store,
    }
    cb(null, r)
  }).catch(cb)
}

function newSignedPreKey (store, keyId, cb) {
  return store.getIdentityKeyPair()
    .then(idKp => {
      return KeyHelper.generateSignedPreKey(idKp, keyId)
    }).then(signedPreKey => {
      store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
      let r = {
        complete: signedPreKey,
        sanitized: cleanSigned(signedPreKey),
        store: store,
      }
      cb(null, r)
    }).catch(cb)
}

function newUnsignedPreKeys (n, cb) {
  unsignedPreKeysPromise(n)
    .then(pks => {
      return pks
    })
    .then(pks => cb(null, {
      complete: pks,
      sanitized: pks.map(cleanUnsigned),
    }))
    .catch(cb)
  return
}

