let memdb = require('memdb')
let idtools = require('./idtools')
let keyserver = require('./keyserver')
let SignalStore =
    require('signal-protocol/test/InMemorySignalProtocolStore')
let signal = require('signal-protocol')
// utilities for setting up level instances
let msgpack = require('msgpack-lite')
let valueEncoding = {encode: msgpack.encode,
                     decode: msgpack.decode,
                     buffer: true,
                    }
let db = memdb({valueEncoding: valueEncoding})
let ks = keyserver(db)
// alice generates an identity
idtools.freshIdentity(1, new SignalStore(), function (err, alice) {
  let pubid = alice.sanitized
  // and registers with the keyserver
  ks.register('alice', pubid, function (err) {
    // bob generates an identity 
    idtools.freshIdentity(1, new SignalStore(), function (err, bob) {
      // and regiseters as well
      ks.register('bob', pubid, function (err) {
        // now bob gets alice's pre-key bundle
        ks.fetchPreKeyBundle('alice', function (err, aliceBundle) {
          // now, bob can build a session cipher with which he can speak to alice
          var aliceAddr = new signal.SignalProtocolAddress("alice", 1)
          var builder = new signal.SessionBuilder(bob.store, aliceAddr)
          builder.processPreKey(aliceBundle)
            .then(() => {
              var bobAddr = new signal.SignalProtocolAddress("bob", 1)
              var aliceSessionCipher = new signal.SessionCipher(alice.store, bobAddr);
              var bobSessionCipher = new signal.SessionCipher(bob.store, aliceAddr);
              // now bob can initiate a conversation with alice
              bobSessionCipher
                .encrypt(new Buffer('hello sweet world'))
                .then(ct =>
                      aliceSessionCipher.decryptPreKeyWhisperMessage(ct.body, 'binary'))
                .then(arraybuff => new Buffer.from(arraybuff).toString())
                .then(plaintext => {
                  console.log(plaintext)
                })
            })
        })
      })
    })
  })
})
