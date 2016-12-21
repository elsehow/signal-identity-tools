# signal-identity-tools

```
npm install signal-identity-tools
```

[WIP]

a keyserver and id generation tools for the [signal-protocol](https://github.com/elsehow/signal-protocol)

[![Build Status](https://travis-ci.org/elsehow/signal-identity-tools.svg?branch=master)](https://travis-ci.org/elsehow/signal-identity-tools)

## example

see `example.js` for a starting point.

the example does not cover uploading new `unsignedPreKeys`, or replacing `signedPreKeys`. see API for details.

(eventually this will all be wrapped in a friendlier way).

## todos & cavaeats

- No rate-limiting or access control on PreKey fetches
  - This is necessary to make sure people don't deplete your one-time prekeys
- No validating uploaded keys (yet)
- The keyserver is just an API
  - You can wrap it in your own transport layer (HTTP, WS, etc)

## api

### let idtools = require('signal-identity-tools/idtools')

#### idtools.freshIdentity(keyId, store, cb)

`keyId` is a number.

`store` is a signal-protocol store (see [signal-protocol](https://github.com/elsehow/signal-protocol)).

Calls back on `(err, { complete, sanitized, store })`. 

`complete` is the full identity, with secret keys. `sanitized` is the public-facing version, ready to send to the keyserver.

The `store` this method returns is the same `store` you pass in. I return it so you will notice that I am mutating it.

#### idtools.newSignedPreKey(identity, keyId, store, cb)

Like `freshIdentity`, calls back on `(err, { complete, sanitized, store } )`

`sanitized` is the public-facing version, ready to send to the keyserver.

#### idtools.newUnsignedPreKeys(n, keyId, cb)

Creates `n` unsigned (one-time) PreKeys. 

Calls back on `(err, { complete, sanitized } )`, where both `complete` and `sanitized` are lists of keys of length `n`.

`sanitized` is the public-facing version, ready to send to the keyserver.

### let keyserver = require('signal-identity-tools/keyserver')

#### ks = keyserver(level)

`level` is a leveldb-like instance.

You will want to configure your level db's encoding a bit, to allow for typed arrays:

```js
// utilities for setting up level instances
var msgpack = require('msgpack-lite')
let valueEncoding = {encode: msgpack.encode,
                     decode: msgpack.decode,
                     buffer: true}
let level = require('level')
let opts = {valueEncoding: valueEncoding}
let db = level('/tmp/myKeyserverDb', opts)
```

#### ks.register(name, publicID, cb)

Registers a new username `name`, where `publicID` comes from the callback value of `idtools.freshIdentity`'s `.sanitized`

`cb(err)`

#### ks.preKeyBundle(name, cb)

Calls back on the keyserver's next PreKeyBundle for a user `name`, per [signal-protocol](https://github.com/elsehow/signal-protocol)'s spec for these bundles.

`b(err, bundle)`

#### ks.replaceSignedPreKey(name, signedPreKey, cb)

In the Signal protocol, [users should replace their signed PreKeys occasionally](https://whispersystems.org/docs/specifications/x3dh/). 

This registers a new Signed PreKey for name, `name`, where `signedPreKey` comes from the callback value of `idtools.newSignedPreKey`'s `.sanitized`.

`cb(err)`

#### ks.uploadUnsignedPreKeys(name, unisgnedPreKeys, cb)

In the Signal protocol, [users must upload unsigned PreKeys regularly](https://whispersystems.org/docs/specifications/x3dh/). 

This uploads new, unsigned (one-time) PreKeys for name `name`, where `unsignedPreKeys` come from the callback value of `idtools.newUnsignedPreKeys`'s `.sanitized`.

`cb(err)`

## license

BSD
