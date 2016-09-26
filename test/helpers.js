let signal = require('signal-protocol')
let KeyHelper = signal.KeyHelper;
let SignalStore = require('signal-protocol/test/InMemorySignalProtocolStore')
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
    unsignedPreKeys: identity.unsignedPreKeys.map(cleanUnsigned),
  }
}
function freshIdentity (keyId, cb) {

  let store = new SignalStore()
  let registrationId = KeyHelper.generateRegistrationId()
  let identity = {
    store: store,
    registrationId: registrationId,
    identityKeyPair: null,
    unsignedPreKeys: [],
    signedPreKey: null,
  }

  // HERE WE GENERATE.....
  // 1. AN IDENTITY KEYPAIR
  KeyHelper.generateIdentityKeyPair().then(function(idKp) {
    identity.identityKeyPair = idKp
  }).then(function () {
    // 2. 10 UNSIGNED PREKEYS
    return unsignedPreKeysPromise(keyId, 10)
  }).then(function(preKeys) {
    identity.unsignedPreKeys = preKeys
    // save the last one in the store
    let preKey = last(preKeys)
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
      sanitized: sanitize(identity)
    }
    cb(null, r)
  }).catch(cb)



}

module.exports = {
  freshIdentity: freshIdentity
}
