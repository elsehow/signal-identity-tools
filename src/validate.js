let equal = require('deep-equal')
let isArrayBuffer = require('is-array-buffer')
let isNumber = x => typeof(x) === 'number'
let crypto = require('signal-protocol/src/crypto.js').crypto


/*
  elsehow, 12/20/16
  oakland
  */

/*
  Check that some `obj` meets the schema for keyserver public IDs.

  Refer to github.com/elsehow/signal-protocol
  for where this schema comes from.

  Exposes a method check(obj)

  {
    registrationId: Number
    identityKey: ArrayBuffer
    signedPreKey: {
      keyId: Number
      publicKey: ArrayBuffer
      signature: ArrayBuffer
    }
    unsignedPreKeys: [{
      keyId: Number
      publicKey: ArrayBuffer
    },
    ...
    ]
  }

*/
function verify (identityKey, signedPreKey, cb) {
  crypto.Ed25519Verify(
    identityKey,
    signedPreKey.publicKey,
    signedPreKey.signature
  ).catch(err => {
    cb('Validation error ' + err)
    return -1
  }).then((res) => {
    if (res!=-1)
      cb()
  })
}
function firstNonNull (arr) {
  for (let i=0;i<arr.length;i++) {
    if (arr[i]!=null)
      return arr[i]
  }
  return null
}
function check (schema) {
  let err = schema.reduce(function (acc, cur) {
    if (!acc) {
      let res =  cur[0]
      if (res)
        return null
      return cur[1]
    }
    return acc
  }, null)
  return err
}
function hasOnlyProps (o, props) {
  return equal(
    Object.keys(o),
    props)
}
function validateUnsignedPreKey (p) {
  let props = ['keyId', 'publicKey']
  let schema = [
    [hasOnlyProps(p, props), 'Unsigned prekey should have props ' + props.join(',')],
    [isNumber(p.keyId), 'preKey.keyID should be a number'],
    [isArrayBuffer(p.publicKey), 'p.publicKey should be an ArrayBuffer'],
  ]
  return check(schema)
}
function validateUnsigned (prekeys) {
  return firstNonNull(prekeys.map(validateUnsignedPreKey))
}
function validateSignedPreKey (idPub, p, cb) {
  let props = ['keyId', 'publicKey', 'signature']
  var schema = [
    [hasOnlyProps(p, props), 'Unsigned prekey should have props ' + props.join(',')],
    [isNumber(p.keyId), 'signedPreKey.keyId should be an Number'],
    [isArrayBuffer(p.publicKey), 'signedPreKey.publicKey should be an ArrayBuffer'],
    [isArrayBuffer(p.signature), 'signedPreKey.signature should be an ArrayBuffer'],
  ]
  let err = check(schema)
  if (err)
    return cb(err)
  // if all else passes,
  // do signature verif.
  verify(idPub,
         p,
         cb)
}
// calls back on error (string) or null
function validatePublicId (id, cb) {
  let props = ['registrationId', 'identityKey', 'signedPreKey', 'unsignedPreKeys']
  validateSignedPreKey(id.identityKey, id.signedPreKey, function (errSignedPk) {
    if (errSignedPk)
      return cb(errSignedPk)
    let errPks = validateUnsigned(id.unsignedPreKeys)
    if (errPks)
      return cb(errPks)
    // check each type is correct
    // [  [check, errorMsg], ... ]
    let schema = [
      [hasOnlyProps(id, props), 'Properties for public id should be ' + props.join(',')],
      [isNumber(id.registrationId), 'public ID should be a number'],
      [isArrayBuffer(id.identityKey), 'identityKey should be an ArrayBuffer'],
    ]
    let valErr = check(schema)
    if (valErr)
      return cb(valErr)
    // if nothing else is wrong,
    // we verify the keys with some crypto
    verify(id.identityKey,
           id.signedPreKey,
           cb)
  })
}

module.exports = {
  publicId: validatePublicId,
  signedPreKey: validateSignedPreKey,
  unsignedPreKeys: validateUnsigned,
}
