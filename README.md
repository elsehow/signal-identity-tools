# signal-identity-tools

```
npm install signal-identity-tools
```

[WIP]

a keyserver and id generation tools for the [signal-protocol](https://github.com/elsehow/signal-protocol)

## example

```javascript
```

## install

## api

### let idtools = require('signal-identity-tools')

### idtools.freshIdentity(key, store, cb)

`key` is a number.

`store` is a signal-protocol store (see [signal-protocol](https://github.com/elsehow/signal-protocol)).

Returns an object `{ complete, sanitized, store }`. `complete` is the full identity, with secret keys. `sanitized` is the public-facing version, ready to send to the keyserver.

The `store` this method returns is the same `store` you pass in. I return it so you will notice that I am mutating it.

### let keyserver = idtools.keyserver()

#### keyserver.register(publicID, cb)

Where `publicID` comes from `idtools.freshIdentity().sanitized`

`cb(err)`

#### keyserver.preKeyBundle(id, cb)

Returns a PreKeyBundle for a user with `id`, per [signal-protocol](https://github.com/elsehow/signal-protocol)'s spec.

`cb(err, res)`

## license

BSD
