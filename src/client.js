var util = require('signal-protocol/src/helpers')

function promiseify (fn) {
  return new Promise((resolve, reject) => {
    fn((err, res) => {
      if (err && err.type !== 'NotFoundError')
        reject(err)
      resolve(res)
    })
  })
}

function SignalProtocolStore(level) {
	this.store = level
}

SignalProtocolStore.prototype = {
	put: function(key, value) {
		if (key === undefined || value === undefined || key === null || value === null)
			throw new Error("Tried to store undefined/null")
    return promiseify(cb => this.store.put(key, value, cb))
	},
	get: function(key) {
		if (key === null || key === undefined)
			throw new Error("Tried to get value for undefined/null key")
		return promiseify(cb => this.store.get(key, cb))
	},
	remove: function(key) {
		if (key === null || key === undefined)
			throw new Error("Tried to remove value for undefined/null key")
    return promiseify(cb => this.store.del(key, cb))
	},

	getIdentityKeyPair: function() {
		return this.get('identityKey')
	},
	getLocalRegistrationId: function() {
		return this.get('registrationId')
	},
	isTrustedIdentity: function(identifier, identityKey) {
		if (identifier === null || identifier === undefined) {
			throw new Error("tried to check identity key for undefined/null key")
    }
		if (!(identityKey instanceof ArrayBuffer)) {
			throw new Error("Expected identityKey to be an ArrayBuffer")
    }
		return this.get('identityKey' + identifier)
      .then(trusted => {
        if (!trusted)
          return Promise.resolve(true)
        return new Promise.resolve(util.toString(identityKey) === util.toString(trusted))
      })
	},
	loadIdentityKey: function(identifier) {
		if (identifier === null || identifier === undefined)
			throw new Error("Tried to get identity key for undefined/null key")
		return this.get('identityKey' + identifier)
	},
	saveIdentity: function(identifier, identityKey) {
		if (identifier === null || identifier === undefined)
			throw new Error("Tried to put identity key for undefined/null key")
		return this.put('identityKey' + identifier, identityKey)
	},

	/* Returns a prekeypair object or undefined */
	loadPreKey: function(keyId) {
    return this.get('25519KeypreKey' + keyId)
      .then(res => {
        if (res !== undefined) {
          res = { pubKey: res.pubKey, privKey: res.privKey }
        }
        return res
      })
	},
	storePreKey: function(keyId, keyPair) {
		return this.put('25519KeypreKey' + keyId, keyPair)
	},
	removePreKey: function(keyId) {
		return this.remove('25519KeypreKey' + keyId)
	},

	/* Returns a signed keypair object or undefined */
	loadSignedPreKey: function(keyId) {
    return this.get('25519KeysignedKey' + keyId)
      .then(res => {
        if (res !== undefined) {
          res = { pubKey: res.pubKey, privKey: res.privKey }
        }
        return res
      })
	},
	storeSignedPreKey: function(keyId, keyPair) {
		return this.put('25519KeysignedKey' + keyId, keyPair)
	},
	removeSignedPreKey: function(keyId) {
		return this.remove('25519KeysignedKey' + keyId)
	},

	loadSession: function(identifier) {
		return this.get('session' + identifier)
	},
	storeSession: function(identifier, record) {
		return this.put('session' + identifier, record)
	},
  removeSession: function(identifier) {
		return this.remove('session' + identifier)
  },
  removeAllSessions: function(identifier) {
    let ps = []
    for (var id in this.store) {
      if (id.startsWith('session' + identifier)) {
        ps.push(this.remove(id))
      }
    }
    return Promise.all(ps)
  }
}

module.exports = SignalProtocolStore
