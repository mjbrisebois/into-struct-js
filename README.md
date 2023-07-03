[![](https://img.shields.io/npm/v/@whi/into-struct/latest?style=flat-square)](http://npmjs.com/package/@whi/into-struct)

# Into Struct
This package is intended to validate and/or convert input against a given struct definition.

[![](https://img.shields.io/github/issues-raw/mjbrisebois/js-into-struct?style=flat-square)](https://github.com/mjbrisebois/js-into-struct/issues)
[![](https://img.shields.io/github/issues-closed-raw/mjbrisebois/js-into-struct?style=flat-square)](https://github.com/mjbrisebois/js-into-struct/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/mjbrisebois/js-into-struct?style=flat-square)](https://github.com/mjbrisebois/js-into-struct/pulls)


## Overview


## Install

```bash
npm i @whi/into-struct
```

## Usage

```javascript
import { intoStruct } from '@whi/into-struct';

const PostStruct = {
    "message": String,
    "tags": VecType( String ),
    "published_at": Number,
    "last_updated": Number,
};

const post = intoStruct({
    "message":		"Hello, world!",
    "tags":		[ "greeting" ],

    "published_at":	Date.now(),
    "last_updated":	Date.now(),
}, PostStruct );
```


### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
