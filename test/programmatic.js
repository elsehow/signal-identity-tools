let test = require('tape')
let idtools = require('..')
let SignalStore = require('signal-protocol/test/InMemorySignalProtocolStore')
var signal = require('signal-protocol')

var ALICE_ADDRESS = new signal.SignalProtocolAddress("+14151111111", 1);
var BOB_ADDRESS   = new signal.SignalProtocolAddress("+14152222222", 1);

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
    ks.register('elsehow', pubid, function (err) {
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
    ks.register('elsehow', BADpubid, function (err) {
      t.ok(err, err)
      t.end()
    })
  })
})

test('fetch that PREKEY BUNDLE and CHAT', t => {
  let ks = idtools.keyserver()
  // alice generates an ID
  genTestId(function (err, aliceIdentity) {
    let aliceSanitized = aliceIdentity.sanitized
    // alice registers
    ks.register(ALICE_ADDRESS.getName(), aliceSanitized, function (err, id) {
      // bob generates an ID
      genTestId(function (err, bobIdentity) {
        // and fetches alice's bundle
        ks.fetchPreKeyBundle(ALICE_ADDRESS.getName(), function (err, aliceBundle) {
          t.notOk(err)
          t.ok(aliceBundle)
          // get signal to accept the pubkey bundle
          var builder = new signal.SessionBuilder(bobIdentity.store, ALICE_ADDRESS)
          // console.log('alice bundle', aliceBundle)
          builder.processPreKey(aliceBundle)
            .then(function () {
              // console.log('alice identity', aliceIdentity.store)
              // console.log('bob identity', bobIdentity.store)

              var aliceSessionCipher = new signal.SessionCipher(aliceIdentity.store, BOB_ADDRESS);
              var bobSessionCipher = new signal.SessionCipher(bobIdentity.store, ALICE_ADDRESS);

              bobSessionCipher
                .encrypt(new Buffer('hello'))
                .then(ct =>
                      aliceSessionCipher.decryptPreKeyWhisperMessage(ct.body, 'binary'))
                .then(() => aliceSessionCipher.encrypt('hello sweet world'))
                .then(ct =>
                      bobSessionCipher.decryptWhisperMessage(ct.body, 'binary'))
                .then(pt => {
                  ptStr = new Buffer(pt).toString()
                  t.deepEqual(ptStr, 'hello sweet world',
                             'round trip encrypt works')
                  t.end()
                }).catch(t.notOk)
            })
        }).catch(t.notOk)
      })
    })
  })
})

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
           // TODO get signal to accept the pubkey bundle
//           t.ok(null)
//           t.end()
//         })
//       })
//     })
//   })
// })
