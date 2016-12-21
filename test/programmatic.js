let test = require('tape')
let idtools = require('..')
let SignalStore = require('signal-protocol/test/InMemorySignalProtocolStore')

function genTestId (cb) {
  idtools.freshIdentity(1, new SignalStore(), cb)
}

test('sanity', t => {
  t.ok(idtools.keyserver)
  t.deepEquals(typeof(idtools.keyserver), 'function')
  let ks = idtools.keyserver()
  t.deepEquals(typeof(ks.register),
               'function')
  t.deepEquals(typeof(ks.fetchPreKeyBundle),
               'function')
  t.end()
})

test('REGISTER a prekey', t => {
  let ks = idtools.keyserver()
  genTestId(function (err, identity) {
    // use the sanitized identity for public keyserver
    let pubid = identity.sanitized
    ks.register(pubid, function (err) {
      t.notOk(err)
      t.end()
    })
  })
})

test('bad prekey REJECT', t => {
  let ks = idtools.keyserver()
  genTestId(function (err, identity) {
    // NO NO don't push your compelte identity
    let BADpubid = identity.complete
    ks.register(BADpubid, function (err) {
      t.ok(err, err)
      t.end()
    })
  })
})

// test('fetch that PREKEY BUNDLE', t => {
//   let ks = idtools.keyserver()
//   genTestId(function (err, identity) {
//     let pubid = identity.sanitized
//     ks.register(pubid, function (err) {
//       ks.fetchPreKeyBundle(pubid.registrationId, function (err, bundle) {
//         t.notOk(err)
//         // TODO get signal to accept the pubkey bundle
//         t.ok(null)
//         t.end()
//       })
//     })
//   })
// })

// test('ALICE+BOB talk after registering', t => {
//   // TODO
//   t.ok(null)
//   t.end()
// })

// test('SETUP and TAREDOWN and PERSIST', t => {
//   let ks = idtools.keyserver('/tmp/kserver')
//   genTestId(function (err, identity) {
//     let pubid = identity.sanitized
//     ks.register(pubid, function (err) {
//       ks.close(function () {
//         console.log('reached')
//         ks = idtools.keyserver('/tmp/kserver')
//         ks.fetchPreKeyBundle(pubid.registrationId, function (err, bundle) {
//           t.notOk(err)
//           // TODO get signal to accept the pubkey bundle
//           t.ok(null)
//           t.end()
//         })
//       })
//     })
//   })
// })
