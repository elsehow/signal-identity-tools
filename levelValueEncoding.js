// utilities for setting up level instances
let msgpack = require('msgpack-lite')
let valueEncoding = {encode: msgpack.encode,
                     decode: msgpack.decode,
                     buffer: true}

module.exports = valueEncoding
