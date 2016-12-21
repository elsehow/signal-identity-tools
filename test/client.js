let test = require('tape')
var signal = require('signal-protocol')
var idtools = require('../idtools')
var h = require('./helpers')

var ALICE_ADDRESS = new signal.SignalProtocolAddress("+14151111111", 1);
var BOB_ADDRESS   = new signal.SignalProtocolAddress("+14152222222", 1);
let dbPath = '/tmp/kserver'

console.log('hi')
