let equal = require('deep-equal')
let isArrayBuffer = require('is-array-buffer');
let isNumber = x => typeof(x) === 'number'

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
function firstNonNull (arr) {
  for (let i=0;i<arr.length;i++) {
    if (arr[i]!=null)
      return arr[i]
  }
  return null
}
function check (schema) {
  return schema.reduce(function (acc, cur) {
    if (!acc) {
      let res =  cur[0]
      if (res)
        return null
      return cur[1]
    }
    return acc
  }, null)
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
function validateSignedPreKey (p) {
  let props = ['keyId', 'publicKey', 'signature']
  var schema = [
    [hasOnlyProps(p, props), 'Unsigned prekey should have props ' + props.join(',')],
    [isNumber(p.keyId), 'signedPreKey.keyId should be an Number'],
    [isArrayBuffer(p.publicKey), 'signedPreKey.publicKey should be an ArrayBuffer'],
    [isArrayBuffer(p.signature), 'signedPreKey.signature should be an ArrayBuffer'],
  ]
  return check(schema)
}
// returns error (string) or null
function validatePublicId (id) {
  let props = ['registrationId', 'identityKey', 'signedPreKey', 'unsignedPreKeys']
  let errSignedPk = validateSignedPreKey(id.signedPreKey)
  if (errSignedPk)
    return errSignedPk
  let errPks = validateUnsigned(id.unsignedPreKeys)
  if (errPks)
    return errPks
  // check each type is correct
  // [  [check, errorMsg], ... ]
  let schema = [
    [hasOnlyProps(id, props), 'Properties for public id should be ' + props.join(',')],
    [isNumber(id.registrationId), 'public ID should be a number'],
    [isArrayBuffer(id.identityKey), 'identityKey should be an ArrayBuffer'],
  ]
  let err = check(schema)
  return err
}

module.exports = {
  publicId: validatePublicId,
  signedPreKey: validateSignedPreKey,
  unsignedPreKeys: validateUnsigned,
}
