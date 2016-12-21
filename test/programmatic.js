let test = require('tape')
let SignalStore = require('signal-protocol/test/InMemorySignalProtocolStore')
var signal = require('signal-protocol')
var keyserver = require('../keyserver')
var idtools = require('../idtools')

var ALICE_ADDRESS = new signal.SignalProtocolAddress("+14151111111", 1);
var BOB_ADDRESS   = new signal.SignalProtocolAddress("+14152222222", 1);

function genTestId (cb) {
  idtools.freshIdentity(1, new SignalStore(), cb)
}

function testConvo (aliceBundle, aliceIdentity, bobIdentity, t) {
  // get signal to accept the pubkey bundle
  var builder = new signal.SessionBuilder(bobIdentity.store, ALICE_ADDRESS)
  return builder.processPreKey(aliceBundle)
    .then(() => {
      t.ok(aliceIdentity.store)
      t.ok(bobIdentity.store)
      var aliceSessionCipher = new signal.SessionCipher(aliceIdentity.store, BOB_ADDRESS);
      var bobSessionCipher = new signal.SessionCipher(bobIdentity.store, ALICE_ADDRESS);
      return bobSessionCipher
        .encrypt(new Buffer('hello'))
        .then(ct => {
          t.equal(ct.type, 3,
                  'ciphertext.type should be 3, preKeyWhisperMessage')
          t.ok(ct.body)
          return ct
        })
        .then(ct =>
              aliceSessionCipher.decryptPreKeyWhisperMessage(ct.body, 'binary'))
        .then(() => aliceSessionCipher.encrypt('hello sweet world'))
        .then(ct => {
          t.equal(ct.type, 1,
                  'ciphertext.type should be 1, whisperMessage')
          t.ok(ct.body)
          return ct
        })
        .then(ct =>
              bobSessionCipher.decryptWhisperMessage(ct.body, 'binary'))
        .then(pt => {
          ptStr = new Buffer(pt).toString()
          t.deepEqual(ptStr, 'hello sweet world',
                      'round trip encrypt works')
          t.end()
        }).catch(t.notOk)
    }).catch(t.notOk)

}

// test('sanity', t => {
//   t.ok(keyserver)
//   t.deepEquals(typeof(keyserver), 'function')
//   let ks = keyserver()
//   t.deepEquals(typeof(ks.register),
//                'function')
//   t.deepEquals(typeof(ks.fetchPreKeyBundle),
//                'function')
//   t.end()
// })

// test('REGISTER a prekey', t => {
//   let ks = keyserver()
//   genTestId(function (err, identity) {
//     // use the sanitized identity for public keyserver
//     let pubid = identity.sanitized
//     ks.register('elsehow', pubid, function (err) {
//       t.notOk(err)
//       t.end()
//     })
//   })
// })

// test('bad prekey REJECT', t => {
//   let ks = keyserver()
//   genTestId(function (err, identity) {
//     // NO NO don't push your compelte identity
//     let BADpubid = identity.complete
//     ks.register('elsehow', BADpubid, function (err) {
//       t.ok(err, err)
//       t.end()
//     })
//   })
// })

// test('fetch that PREKEY BUNDLE and CHAT', t => {
//   let ks = keyserver()
//   // alice generates an ID
//   genTestId(function (err, aliceIdentity) {
//     let aliceSanitized = aliceIdentity.sanitized
//     // alice registers
//     ks.register(ALICE_ADDRESS.getName(), aliceSanitized, function (err, id) {
//       // bob generates an ID
//       genTestId(function (err, bobIdentity) {
//         // and fetches alice's bundle
//         ks.fetchPreKeyBundle(ALICE_ADDRESS.getName(), function (err, aliceBundle) {
//           testConvo(aliceBundle, aliceIdentity, bobIdentity, t).catch(t.notOk)
//         })
//       })
//     })
//   })
// })

// test('REPLACE signed prekey', t => {
//   let ks = keyserver()
//   // alice generates an ID
//   genTestId(function (err, aliceIdentity) {
//     let aliceSanitized = aliceIdentity.sanitized
//     // alice registers
//     ks.register(ALICE_ADDRESS.getName(), aliceSanitized, function (err, id) {
//       idtools.newSignedPreKey(aliceIdentity, 1, aliceIdentity.store, function (err, signedPreKey) {
//         t.notOk(err)
//         t.ok(signedPreKey)
//         // replace on server
//         ks.replaceSignedPreKey(ALICE_ADDRESS.getName(), signedPreKey.sanitized, function (err, res) {
//           t.notOk(err)
//           t.ok(res)
//           t.end()
//         })
//       })
//     })
//   })
// })

// test('UPLOAD ADDITONAL one-time prekeys', t => {
//   let ks = keyserver()
//   // alice generates an ID
//   genTestId(function (err, aliceIdentity) {
//     let aliceSanitized = aliceIdentity.sanitized
//     // alice registers
//     ks.register(ALICE_ADDRESS.getName(), aliceSanitized, function (err, id) {
//       idtools.newUnsignedPreKeys(10, 1, function (err, prekeys) {
//         t.notOk(err)
//         t.equal(prekeys.complete.length, 10,
//                 'prekes.complete is the right length')
//         t.equal(prekeys.sanitized.length, 10,
//                 'prekes.sanitized is the right length')
//         // replace on server
//         ks.uploadUnsignedPreKeys(ALICE_ADDRESS.getName(), prekeys.sanitized, function (err, res) {
//           t.notOk(err)
//           t.ok(res)
//           t.end()
//         })
//       })
//     })
//   })
// })

// test('chat with NO ONE-TIME PREKEYS?', t => {
//   let ks = keyserver()
//   idtools.freshIdentity(1, new SignalStore(), function (_, aliceIdentity) {
//     ks.register(ALICE_ADDRESS.getName(), aliceIdentity.sanitized, function (_, _) {
//       idtools.freshIdentity(1, new SignalStore(), function (_, bobIdentity) {
//         ks.register(BOB_ADDRESS.getName(), bobIdentity.sanitized, function (_, _) {
//           // use up the 1 unsigned prekey
//           ks.fetchPreKeyBundle(ALICE_ADDRESS.getName(), function (_, _) {
//             // this one should have no PreKey
//             ks.fetchPreKeyBundle(ALICE_ADDRESS.getName(), function (err, bundle) {
//               t.notOk(bundle.preKey, 'no prekeys here')
//               testConvo(bundle, aliceIdentity, bobIdentity, t)
//             })
//           })
//         })
//       })
//     })
//   }, {
//     nUnsignedPreKeys:1 // only generate 1 one-time prekey
//   })
// })

// test('support multiple UNSIGNED PREKEYS', t => {
//   t.ok(null)
//   t.end()
// })
var msgpack = require('msgpack-lite')
let valueEncoding = {encode: msgpack.encode,
                     decode: msgpack.decode,
                     buffer: true,
                    }
let level = require('level')
test('SETUP and TAREDOWN and PERSIST', t => {
  let path = '/tmp/kserver'
  let ks = keyserver(level(path, {valueEncoding:valueEncoding}))
  genTestId(function (err, identity) {
    let pubid = identity.sanitized
    let n = ALICE_ADDRESS.getName()
    ks.register(n, pubid, function (err) {
      t.notOk(err)
      ks.close(function (err) {
        t.notOk(err,
                'no errors closing')
        ks = keyserver(level(path, {valueEncoding: valueEncoding}))
        ks.fetchPreKeyBundle(n, function (err, bundle) {
          t.notOk(err)
          t.ok(bundle.identityKey,
              'bundle has identityKey')
          t.ok(bundle.signedPreKey,
              'bundle has signedPreKey')
          ks.close(t.end)
        })
      })
    })
  })
})

test.onFinish(() => {
  console.log('finishing')
  let path = '/tmp/kserver'
  let lvl = level(path)
  lvl.del(ALICE_ADDRESS.getName(), function () {
    console.log('deleted')
  })
})
