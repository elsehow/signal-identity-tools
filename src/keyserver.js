let equal = require('deep-equal')
let isArrayBuffer = require('is-array-buffer');
let isNumber = x => typeof(x) === 'number'

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
// returns error (string) or null
function validate (publicId) {
  // check each type is correct
  // [  [check, errorMsg], ... ]
  let errPks = firstNonNull(publicId.unsignedPreKeys.map(validateUnsignedPreKey))
  let props = ['registrationId', 'identityKey', 'signedPreKey', 'unsignedPreKeys']
  let signedProps = ['keyId', 'publicKey', 'signature']
  let schema = [
    [hasOnlyProps(publicId, props), 'Properties for public id should be ' + props.join(',')],
    [isNumber(publicId.registrationId), 'public ID should be a number'],
    [isArrayBuffer(publicId.identityKey), 'identityKey should be an ArrayBuffer'],

    [hasOnlyProps(publicId.signedPreKey, signedProps), 'Properties for signedPreKey should be ' + signedProps.join(',')],
    [isNumber(publicId.signedPreKey.keyId), 'signedPreKey.keyId should be an Number'],
    [isArrayBuffer(publicId.signedPreKey.publicKey), 'signedPreKey.publicKey should be an ArrayBuffer'],
    [isArrayBuffer(publicId.signedPreKey.signature), 'signedPreKey.signature should be an ArrayBuffer'],
    [errPks ? false : true, errPks ],
    // TODO check that it doesn't have any UNEXPECTED data
  ]
  let err = check(schema)
  return err
}
function register (publicIdentity, cb) {
  let err = validate(publicIdentity)
  if (!err)
    return cb(null)
  return cb(err)
}
function fetchPreKeyBundle (id, cb) {
  cb(null)
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
