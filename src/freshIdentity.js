let signal = require('signal-protocol')
let KeyHelper = signal.KeyHelper;
let last = arr => arr[arr.length-1]

/*
calls back on an object

  { registrationId, identityKeyPair, store, publicIdentity }

publicIdentity

*/

function unsignedPreKeysPromise (keyId, n) {
  let ps = []
  for (let i=0;i<n;i++)
    ps.push(KeyHelper.generatePreKey(keyId))
  return Promise.all(ps)
}

function sanitize (identity) {

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


  return {
    registrationId: identity.registrationId,
    identityKey: identity.identityKeyPair.pubKey,
    signedPreKey: cleanSigned(identity.signedPreKey),
    // unsignedPreKeys: identity.unsignedPreKeys.map(cleanUnsigned),
    preKey: cleanUnsigned(identity.preKey)
  }
}

function freshIdentity (keyId, store, cb) {

  let registrationId = KeyHelper.generateRegistrationId()
  store.put('registrationId', registrationId);
  let identity = {
    registrationId: registrationId,
    identityKeyPair: null,
    // unsignedPreKeys: [],
    preKey: null,
    signedPreKey: null,
  }


  // HERE WE GENERATE.....
  // 1. AN IDENTITY KEYPAIR
  KeyHelper.generateIdentityKeyPair()
    .then(function(idKp) {
      identity.identityKeyPair = idKp
      store.put('identityKey', idKp);
    }).then(function () {
      // 2. 10 UNSIGNED PREKEYS
      return unsignedPreKeysPromise(keyId, 1)
    }).then(function(preKeys) {
      let preKey = preKeys[0]
      identity.unsignedPreKeys = preKey
      identity.preKey  = preKeys[0]
      // save the last one in the store
      store.storePreKey(preKey.keyId, preKey.keyPair);
    }).then(function () {
      // 3. A SIGNED PREKEY
      return KeyHelper.generateSignedPreKey(identity.identityKeyPair, keyId)
    }).then(function(signedPreKey) {
      identity.signedPreKey = signedPreKey
      store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
      // DONE CALLBACK
    }).then(function() {
      let r = {
        complete: identity,
        sanitized: sanitize(identity),
        store: store,
      }
      cb(null, r)
    }).catch(cb)
  
}

module.exports = freshIdentity
