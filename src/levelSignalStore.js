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

function SignalProtocolStore (level) {

	function put (key, value) {
		if (key === undefined || value === undefined || key === null || value === null)
			throw new Error("Tried to level undefined/null")
    return promiseify(cb => level.put(key, value, cb))
	}

	function get (key) {
		if (key === null || key === undefined)
			throw new Error("Tried to get value for undefined/null key")
		return promiseify(cb => level.get(key, cb))
	}

	function remove (key) {
		if (key === null || key === undefined)
			throw new Error("Tried to remove value for undefined/null key")
    return promiseify(cb => level.del(key, cb))
	}

  return {
    put: put,
    get: get,
    remove: remove,
	  getIdentityKeyPair: function() {
		  return get('identityKey')
	  },
	  getLocalRegistrationId: function() {
		  return get('registrationId')
	  },
	  isTrustedIdentity: function(identifier, identityKey) {
		  if (identifier === null || identifier === undefined) {
			  throw new Error("tried to check identity key for undefined/null key")
      }
		  if (!(identityKey instanceof ArrayBuffer)) {
			  throw new Error("Expected identityKey to be an ArrayBuffer")
      }
		  return get('identityKey' + identifier)
        .then(trusted => {
          if (!trusted)
            return Promise.resolve(true)
          return Promise.resolve(util.toString(identityKey) === util.toString(trusted))
        })
	  },
	  loadIdentityKey: function(identifier) {
		  if (identifier === null || identifier === undefined)
			  throw new Error("Tried to get identity key for undefined/null key")
		  return get('identityKey' + identifier)
	  },
	  saveIdentity: function(identifier, identityKey) {
		  if (identifier === null || identifier === undefined)
			  throw new Error("Tried to put identity key for undefined/null key")
		  return put('identityKey' + identifier, identityKey)
	  },

	  /* Returns a prekeypair object or undefined */
	  loadPreKey: function(keyId) {
      return get('25519KeypreKey' + keyId)
        .then(res => {
          if (res !== undefined) {
            res = { pubKey: res.pubKey, privKey: res.privKey }
          }
          return res
        })
	  },
	  storePreKey: function(keyId, keyPair) {
		  return put('25519KeypreKey' + keyId, keyPair)
	  },
	  removePreKey: function(keyId) {
		  return remove('25519KeypreKey' + keyId)
	  },

	  /* Returns a signed keypair object or undefined */
	  loadSignedPreKey: function(keyId) {
      return get('25519KeysignedKey' + keyId)
        .then(res => {
          if (res !== undefined) {
            res = { pubKey: res.pubKey, privKey: res.privKey }
          }
          return res
        })
	  },
	  storeSignedPreKey: function(keyId, keyPair) {
		  return put('25519KeysignedKey' + keyId, keyPair)
	  },
	  removeSignedPreKey: function(keyId) {
		  return remove('25519KeysignedKey' + keyId)
	  },

	  loadSession: function(identifier) {
		  return get('session' + identifier)
	  },
	  storeSession: function(identifier, record) {
		  return put('session' + identifier, record)
	  },
    removeSession: function(identifier) {
		  return remove('session' + identifier)
    },
    removeAllSessions: function(identifier) {
      let ps = []
      db.createKeyStream()
        .on('data', function (id) {
          if (id.startsWith('session' + identifier))
            ps.push(remove(id))
        })
      return Promise.all(ps)
    }
  }
}

module.exports = SignalProtocolStore
