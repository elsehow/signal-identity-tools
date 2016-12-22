# contributing 

## notes

Why bundle the keyserver and id generator?
Shouldn't they be separate?

Well, the keyserver is so tightly complected with the ID generation
(after all, the keyserver needs to validate whatever the ID generator produces).
So, I am bundling them for now. 
You can require them separately in your applications.

## developing

clone this repository, then

    npm install
    npm run watch

now you can edit js files in src/ and test/ - tests will automatically re-run

## todo

- [x] Make a level-using Signal store
  - [x] Test it in keyserver
- [x] Design an api for `client(level)`
  - [x] Guessing it will be level methods + idtools methods
  - [x] Methods also for session ciphers
- [x] Emit an event when a user's low on prekeys
  - [o] We handle the details on the transport layer

- [x] Verifying keys?
  - [x] New identities?
  - [x] New signed prekeys?
  - [?] New unsigned prekeys? (Can we do this? Do we need to?)
    - [x] if eve uploads keys for alice, she can disrupt alice's attempt to reach bob
    - [?] is there any way to verify an unsigned prekey?
  
  
- [ ] Document the keyserver / client 
  - [ ] One for key management (of secret keys), the other servering (public) identities for many clients
  - [ ] Warning about how we don't do rate limiting
  - [ ] Document opts n unsigned client, n unsinged low thresh on keyserver
- [ ] Important
  - [ ] Unsigned prekey uploads are not verified. 
    - [ ] One way to solve this might be to upload signed prekeys, and have keyserver discard the signatures.
  - [ ] Bob should keep around his old signed prekeys for a while after he uploads a new one
  - [ ] Rate limit people who might be trying to exhaust someone's prekeys!
  - [ ] Make sure to notify people when their prekeys are getting low ('low-prekeys', username, num_remain)

## post-notes

- [ ] Imagine what can be done with socket.io message delivery
  - [ ] Imagine using that to coordinate other activities
  - [ ] 1:1 torrent? Netcat? Google Doc / hyperpad?
