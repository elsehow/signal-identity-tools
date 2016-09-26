let test = require('tape')
let keyserver = require('..')
let h = require('./helpers')

test('sanity', t => {
  t.ok(keyserver)
  t.deepEquals(typeof(keyserver), 'function')
  let ks = keyserver()
  t.deepEquals(typeof(ks.register),
               'function')
  t.deepEquals(typeof(ks.fetchPreKeyBundle),
               'function')
  t.end()
})

test('REGISTER a prekey', t => {
  let ks = keyserver()
  h.freshIdentity(1, function (err, identity) {
    // use the sanitized identity for public keyserver
    let pubid = identity.sanitized
    ks.register(pubid, function (err) {
      t.notOk(err)
      t.end()
    })
  })
})

test('bad prekey REJECT', t => {
  let ks = keyserver()
  h.freshIdentity(1, function (err, identity) {
    // NO NO don't push your compelte identity
    let BADpubid = identity.complete
    ks.register(BADpubid, function (err) {
      t.ok(err, err)
      t.end()
    })
  })
})

test('fetch that PREKEY BUNDLE', t => {
  let ks = keyserver()
  h.freshIdentity(1, function (err, identity) {
    let pubid = identity.sanitized
    ks.register(pubid, function (err) {
      ks.fetchPreKeyBundle(pubid.registrationId, function (err, bundle) {
        t.notOk(err)
        // TODO get signal to accept the pubkey bundle
        t.ok(null)
        t.end()
      })
    })
  })
})

test('ALICE+BOB talk after registering', t => {
  // TODO
  t.ok(null)
  t.end()
})
