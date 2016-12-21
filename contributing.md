# contributing 

## notes

Why bundle the keyserver and id generator?
Shouldn't they be separate?

Well, the keyserver is so tightly complected with the ID generation
(after all, the keyserver needs to validate whatever the ID generator produces).
So, I am bundling them for now. 
You can require tehm separately in your applications.

## developing

clone this repository, then

    npm install
    npm run watch

now you can edit js files in src/ and test/ - tests will automatically re-run

## todo

- [ ] Make a level-using Signal store
  - [ ] Test it in keyserver
- [ ] Design an api for `client(level)`
  - [ ] Guessing it will be level methods + idtools methods
  - [ ] Potentially also methods for session ciphers
