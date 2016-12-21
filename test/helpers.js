var msgpack = require('msgpack-lite')
let valueEncoding = {encode: msgpack.encode,
                     decode: msgpack.decode,
                     buffer: true,}


// TODO test helper
var memdb = require('memdb')
let level = require('level')
function dbAt (path){
  let opts = {valueEncoding: valueEncoding}
  if (!path)
    return memdb(opts)
  return level(path, opts)
}
module.exports = {
  dbAt: dbAt,
}
