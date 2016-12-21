# contributing 

## notes

Why bundle the keyserver and id generator?
Shouldn't they be separate?

Well, the keyserver is so tightly complected with the ID generation
(after all, the keyserver needs to validate whatever the ID generator produces).
So, i am bundling them for now. Happy to hearjk

## developing

clone this repository, then

    npm install
    npm run watch

now you can edit js files in src/ and test/ - tests will automatically re-run

## todo

development priorities here
