var extend = require('xtend')
var store = require('./src/levelSignalStore')
var idtools = require('./src/idtools')
var partial = require('lodash.partial')

module.exports = (level) => {
  let s = store(level)
  let r = extend(s,idtools)
  let partialStore = (obj, prop) => {
    obj[prop] = partial(obj[prop], s)
  }
  partialStore(r,'freshIdentity')
  partialStore(r,'newSignedPreKey')
  return r
}
