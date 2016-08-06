# Mega Helper

Get info de [mega.nz](https://mega.nz/) links (direct links and folders)

[![Build Status](https://travis-ci.org/jlobos/mega-helper.svg?branch=master)](https://travis-ci.org/jlobos/mega-helper)
[![Build status](https://ci.appveyor.com/api/projects/status/w96td4bv48h1173d?svg=true)](https://ci.appveyor.com/project/jlobos/mega-helper)
[![bitHound Code](https://www.bithound.io/github/jlobos/mega-helper/badges/code.svg)](https://www.bithound.io/github/jlobos/mega-helper)
[![bitHound Dependencies](https://www.bithound.io/github/jlobos/mega-helper/badges/dependencies.svg)](https://www.bithound.io/github/jlobos/mega-helper/master/dependencies/npm)

> Code written in base of [mega-filename.js](https://gist.github.com/qgustavor/9b9af6c8baa8693720a8) and [crypto](https://github.com/tonistiigi/mega/tree/master/lib/crypto)

```js
import megaHelper from 'mega-helper'

megaHelper('link').checkStatus((err, res) => {
  if (err) return console.error(err)
  console.log(res)
})

megaHelper('link').loadAttributes((err, res) => {
  if (err) return console.error(err)
  console.log(res)
})
```

* `megaHelper('link').checkStatus(callback)` Check if mega link is valid.
* `megaHelper('link').loadAttributes(callback)` Get attributes of link (name, size, etc).

## Installation

```
npm install mega-helper
```

## Testing

```
npm install
npm test
```
