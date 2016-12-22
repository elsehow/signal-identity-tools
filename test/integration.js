let test = require('tape')
let keyserver = require('../keyserver')
let client = require('../client')
let valEncoding = require('../levelValueEncoding')
let memdb = require('memdb')
let level = require('level')
let levelDb = () => level(dbPath, {valueEncoding: valEncoding})
let newDb = () => memdb({valueEncoding: valEncoding})
let dbPath = '/tmp/kserver'


test('sanity', t => {
  t.ok(keyserver)
  t.deepEquals(typeof(keyserver), 'function')
  let ks = keyserver()
  t.deepEquals(typeof(ks.register),
               'function')
  t.deepEquals(typeof(ks.fetchPreKeyBundle),
               'function')
  t.ok(client)
  t.deepEquals(typeof(client), 'function')
  t.end()
})

test('emit LOW-PREKEYS event when a user is low', t => {
  let ks = keyserver(newDb(), {
    lowPreKeyThreshold: 19, // when a user has only 19 prekeys left,
  })                        // we will emit a 'low-prekeys' event
  let c = client(newDb())
  c.freshIdentity(1, function (err, identity) {
    // use the sanitized identity for public keyserver
    let pubid = identity.sanitized
    ks.on('low-prekeys', function (username, numRemaining) {
      t.equal(numRemaining, 19)
      t.deepEqual(username, 'elsehow')
      t.end()
    })
    ks.register('elsehow', pubid, function (err) {
      ks.fetchPreKeyBundle('elsehow', () => {})
    })
  }, {
    nUnsignedPreKeys: 20
  })
})

test('REGISTER a prekey', t => {
  let ks = keyserver(newDb())
  let c = client(newDb())
  c.freshIdentity(1, function (err, identity) {
    // use the sanitized identity for public keyserver
    let pubid = identity.sanitized
    ks.register('elsehow', pubid, function (err) {
      t.notOk(err)
      t.end()
    })
  })
})

test('REJECT non-sanitized keys', t => {
  let ks = keyserver(newDb())
  let c = client(newDb())
  c.freshIdentity(1, function (err, identity) {
    // NO NO don't push your compelte identity
    let BADpubid = identity.complete
    ks.register('elsehow', BADpubid, function (err) {
      t.ok(err, err)
      t.end()
    })
  })
})

test('REJECT a good sanitized identity with a bad key', t => {
  let ks = keyserver(newDb())
  let c = client(newDb())
  c.freshIdentity(1, function (err, identity) {
    // NO NO don't push your compelte identity
    let BADpubid = identity.sanitized
    BADpubid.signedPreKey.publicKey = new ArrayBuffer(33)
    ks.register('elsehow', BADpubid, function (err) {
      t.ok(err, err)
      t.end()
    })
  })
})

test('fetch that PREKEY BUNDLE and CHAT', t => {
  let ks = keyserver(newDb())
  let alice = client(newDb())
  let name = 'alice'
  alice.freshIdentity(1, function (err, aliceIdentity) {
    let aliceSanitized = aliceIdentity.sanitized
    // alice registers
    ks.register(name, aliceSanitized, function (err, id) {
      // bob generates an ID
      let bob = client(newDb())
      bob.freshIdentity(1, function (err, bobIdentity) {
        // and fetches alice's bundle
        ks.fetchPreKeyBundle(name, function (err, aliceBundle) {
          testConvo(aliceBundle, 'alice', 'bob', alice, bob, t).catch(t.notOk)
            .catch(t.notOk)
            .then(t.end)
        })
      })
    })
  })
})

test('REPLACE signed prekey', t => {
  let newSprK;
  let ks = keyserver(newDb())
  let alice = client(newDb())
  let n = 'alice'
  // alice generates an ID
  alice.freshIdentity(1, function (err, aliceIdentity) {
    let aliceSanitized = aliceIdentity.sanitized
    // alice registers
    ks.register(n, aliceSanitized, function (err, id) {
      alice.newSignedPreKey(1, function (err, signedPreKey) {
        t.notOk(err)
        t.ok(signedPreKey)
        newSprK = signedPreKey.sanitized
        // replace on server
        ks.replaceSignedPreKey(n, signedPreKey.sanitized, function (err) {
          t.notOk(err)
          ks.fetchPreKeyBundle(n, function (err, bundle) {
            t.notOk(err)
            t.deepEqual(bundle.signedPreKey, newSprK)
            t.end()
          })
        })
      })
    })
  })
})

test('REJECT invalid prekey replacement', t => {
  let ks = keyserver(newDb())
  let alice = client(newDb())
  let n = 'alice'
  // alice generates an ID
  alice.freshIdentity(1, function (err, aliceIdentity) {
    let aliceSanitized = aliceIdentity.sanitized
    // alice registers
    ks.register(n, aliceSanitized, function (err, id) {
      alice.newSignedPreKey(1, function (err, signedPreKey) {
        spk = signedPreKey
        t.notOk(err)
        t.ok(signedPreKey)
        // phony signature
        let san = signedPreKey.sanitized
        san.signature = new ArrayBuffer(64)
        // try to replace on server
        ks.replaceSignedPreKey(n, san, function (err) {
          t.ok(err)
          t.end()
        })
      })
    })
  })
})

test('UPLOAD ADDITONAL one-time prekeys', t => {
  let ks = keyserver(newDb())
  let alice = client(newDb())
  let n = 'alice'
  // alice generates an ID
  alice.freshIdentity(1, function (err, aliceIdentity) {
    let aliceSanitized = aliceIdentity.sanitized
    // alice registers
    ks.register(n, aliceSanitized, function (err, id) {
      alice.newUnsignedPreKeys(10, function (err, prekeys) {
        t.notOk(err)
        t.equal(prekeys.complete.length, 10,
                'prekeys.complete is the right length')
        t.equal(prekeys.sanitized.length, 10,
                'prekeys.sanitized is the right length')
        // replace on server
        ks.fetchPreKeyBundle(n, function (err, bundle) {
          t.notOk(err)
          t.ok(bundle.preKey)
          ks.fetchPreKeyBundle(n, function (err, bundle) {
            t.notOk(err)
            t.notOk(bundle.preKey)
            ks.uploadUnsignedPreKeys(n, prekeys.sanitized, function (err) {
              ks.fetchPreKeyBundle(n, function (err, bundle) {
                t.notOk(err)
                t.ok(bundle.preKey)
                t.end()
              })
            })
          })
        })
      })
    })
  }, {
    nUnsignedPreKeys: 1,
  })
})

test.skip('We can chat with NO ONE-TIME PREKEYS?', t => {
  let ks = keyserver(newDb())
  ks.on('low-prekeys', function (user, num) {
    t.equal(num, 0, '0 remaining')
  })
  alice = client(newDb())
  alice.freshIdentity(1, function (_, aliceIdentity) {
    ks.register('alice', aliceIdentity.sanitized, function (_, _) {
      bob = client(newDb())
      bob.freshIdentity(1, function (_, bobIdentity) {
        ks.register('bob', bobIdentity.sanitized, function (_, _) {
          // use up the 1 unsigned prekey
          ks.fetchPreKeyBundle('alice', function (_, _) {
            // now, this one should have no PreKey
            ks.fetchPreKeyBundle('alice', function (err, bundle) {
              console.log(bundle)
              t.notOk(bundle.preKey, 'no prekeys here')
              testConvo(bundle, 'alice', 'bob', alice, bob, t)
                .catch(t.notOk)
                .then(t.end)
            })
          })
        })
      })
    })
  }, {
    nUnsignedPreKeys:1 // only generate 1 one-time prekey
  })
})

test('SETUP and TAREDOWN and PERSIST', t => {
  let ks = keyserver(levelDb())
  let c = client(newDb())
  c.freshIdentity(1, function (err, identity) {
    let pubid = identity.sanitized
    let n = 'alice'
    ks.register(n, pubid, function (err) {
      t.notOk(err)
      ks.close(function (err) {
        t.notOk(err,
                'no errors closing')
        ks = keyserver(levelDb())
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
  console.log('finishing...')
  let lvl = level(dbPath)
  lvl.del('alice', function () {
    console.log('finished')
  })
})

// TODO
test.skip('IMPT - Eve can disrupt Bob and Alice\'s communication by uploading unsigned prekeys for Alice.', t => {
  let ks = keyserver(newDb())
  let alice = client(newDb())
  let eve = client(newDb())
  // alice will upload 1 prekey, registering as 'alice'
  alice.freshIdentity(1, function (err, identity) {
    ks.register('alice', identity.sanitized, function (err) {
      // now we will remove her one bundle
      ks.fetchPreKeyBundle('alice', function (err, _) {
        // she has no more unsigned pre-keys, right?
        ks.fetchPreKeyBundle('alice', function (err, bundle) {
          t.notOk(bundle.preKey)
          // now eve will publish some prekeys on alice's behalf...
          eve.newUnsignedPreKeys(10, 1, function (err, prekeys) {
            ks.uploadUnsignedPreKeys('alice', prekeys.sanitized, function (err) {
              //now, can alice and bob start a conversation?
              let bob = client(newDb())
              bob.freshIdentity(1, function (err, bobIdentity) {
                // and fetches alice's bundle
                ks.fetchPreKeyBundle('alice', function (err, aliceBundle) {
                  testConvo(aliceBundle, 'alice', 'bob', alice, bob,t)
                    .catch(t.ok)
                    .then(t.end)
                })
             })
            })
          })
        })
      })
    })
  }, {
    nUnsignedPreKeys:1
  })
})


test('support MULTIPLE CONVERSATIONS', t => {
  let ks = keyserver(newDb())
  let alice = client(newDb())
  let name = 'alice'
  alice.freshIdentity(1, function (err, aliceIdentity) {
    let aliceSanitized = aliceIdentity.sanitized
    // alice registers
    ks.register(name, aliceSanitized, function (err, id) {
      // bob generates an ID
      let bob = client(newDb())
      bob.freshIdentity(1, function (err, bobIdentity) {
        // and fetches alice's bundle
        ks.fetchPreKeyBundle(name, function (err, aliceBundle) {
          testConvo(aliceBundle, 'alice', 'bob', alice, bob, t).catch(t.notOk)
          let calvin = client(newDb())
          calvin.freshIdentity(1, function (err, calvinIdentity) {
            ks.fetchPreKeyBundle(name, function (err, aliceBundle2) {
              testConvo(aliceBundle2, 'alice', 'calvin', alice, calvin, t)
                .catch(t.notOk)
                .then(t.end)
            })
          })
        })
      })
    })
  })
})


function testConvo (aliceBundle, aliceName, bobName, aliceIdentity, bobIdentity, t) {
  // get signal to accept the pubkey bundle
  let builder = bobIdentity.sessionBuilder(aliceName, 1)
  return builder.processPreKey(aliceBundle)
    .then(() => {
      let aliceSessionCipher = aliceIdentity.sessionCipher(bobName, 1)
      let bobSessionCipher = bobIdentity.sessionCipher(aliceName, 1)
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
        }).catch(t.notOk)
    }).catch(t.notOk)
}
