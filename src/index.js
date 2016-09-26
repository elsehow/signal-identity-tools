/*
  TODO Check schema
       Is there a tool for this in signal-protocol?
       or, worth bringing in another, to be explicit??
 {
  registrationId: Number
  identityKey: ArrayBuffer
  signedPreKey: {
    keyId: Number
    publicKey: ArrayBuffer
    signature: ArrayBuffer
  }
  preKey: {
    keyId: Number
    publicKey: ArrayBuffer
  }
  unsignedPreKeys: identity.unsignedPreKeys,
 }

*/
function register (publicIdentity, cb) {
  cb(null)
}
function fetchPreKeyBundle (id, cb) {
  cb(null)
}
module.exports = function () {
  return {
    register:register,
    fetchPreKeyBundle: fetchPreKeyBundle,
  }
}
