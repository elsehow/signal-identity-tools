let memdb = require('memdb')
let client = require('../client')
let keyserver = require('../keyserver')
let valEncoding = require('../levelValueEncoding')
let newDb = () => memdb({valueEncoding: valEncoding})
let ks = keyserver(newDb())

// alice makes a client, and generates an identity
let alice = client(newDb())

alice.freshIdentity(1, function (err, id) {
  if (err) console.log('err!', err)
  let pubid = id.sanitized
  // bob does the same
  let bob = client(newDb())
  bob.freshIdentity(1, function (err, _) {
    // now alice registers with the keyserver
    ks.register('alice', id.sanitized, function (err) {
      // alice should upload new unsigned prekeys when the keyserver asks her to
      uploadNewPreKeysWhenAsked('alice', 1, alice, ks)
      // she should also replace her signed PreKey occasionally
      replaceSignedPreKeyOccasionally('alice', 1, alice, ks, 1000)
      // without registering (!) bob gets alice's pre-key bundle
      ks.fetchPreKeyBundle('alice', function (err, aliceBundle) {
        // now, bob can build a session cipher with which he can speak to alice
        bob.sessionBuilder('alice', 1).processPreKey(aliceBundle)
            .then(() => {
              var bobSessionCipher = bob.sessionCipher('alice', 1)
              var aliceSessionCipher = alice.sessionCipher('bob', 1)
              // now bob can initiate a conversation with alice
              let bobEnc = str => bobSessionCipher.encrypt(new Buffer(str))
              return bobEnc('hello sweet world')
                .then(ct => {
                  // bob sends a prekey whisper message to introduce himself
                  // alice decrypts it
                  return aliceSessionCipher.decryptPreKeyWhisperMessage(ct.body, 'binary')
                }).then(plaintextArrayBuf => {
                  // now she will encrypt the same message back to him
                  return aliceSessionCipher.encrypt(plaintextArrayBuf)
                }).then(ct => {
                  // since they are introduced, bob can now decrypt whisper messages
                  return bobSessionCipher.decryptWhisperMessage(ct.body, 'binary')
                }).then(plaintextArrayBuf => {
                  // conver the plaintext array buffer back to str
                  let str = new Buffer.from(plaintextArrayBuf).toString()
                  console.log(str)
                })
            }).catch(err => console.log('ERR!', err))
      })
    })
  })
})

function replaceSignedPreKeyOccasionally (name, keyId, identity, keyserv, ms) {
  function replace () {
    identity.newSignedPreKey(keyId, function (err, signedPreKey) {
      ks.replaceSignedPreKey(name, signedPreKey.sanitized, function (err) {
        if (err) console.log('err?', err)
      })
    })
  }
  setInterval(replace, ms)
  return
}

function uploadNewPreKeysWhenAsked (name, keyId, identity, keyserv) {
  // if the keyserver says someone is low on unsigned prekeys,
  keyserv.on('low-prekeys', function (username, numRemaining) {
    if (username === 'alice') {
      // they should generate more
      identity.newUnsignedPreKeys(10, function (err, prekeys) {
        // and upload them to the keyserver
        keyserv.uploadUnsignedPreKeys(name, prekeys.sanitized, function (err) {
          if (err) console.log('err!', err)
        })
      })
    }
  })
}
