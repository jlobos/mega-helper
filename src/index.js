
import request from 'request'
import extend from 'deep-extend'
import { parse } from 'url'
import * as crypto from './crypto'

module.exports = url => new Mega(url)

class Mega {
  constructor (url) {
    this.api = 'https://g.api.mega.co.nz/'
    this.url = parse(url)
    this.id = Math.random().toString().substr(2, 10)
  }

  _request (payload, n, cb) {
    let qs = { id: (this.id++).toString() }
    if (n) { qs.n = n }

    request({
      uri: `${this.api}cs`,
      qs: qs,
      method: 'POST',
      json: [ payload ]
    }, (error, response, body) => cb(error, body))
  }

  checkStatus (cb) {
    let split, payload

    if (!this.url.hash) {
      return cb({ error: 'url hash not available' })
    } else {
      split = this.url.hash.split('!')
      if (split.length < 3) {
        return cb({ error: 'url invalid' })
      } else if (!split[2]) {
        return cb({ error: 'shared key not available' })
      }
    }

    // folder or file

    if (split[0] === '#F') {
      payload = { 'a': 'f', 'c': 1, 'r': 1, 'ca': 1 }
    } else if (split[0] === '#') {
      payload = { 'a': 'g', 'p': split[1] }
    }

    this._request(payload, split[1], (e, b) => {
      if (e || !b) return cb({ error: e || 'request' })

      if (b.length) b = b[0]
      if (typeof b === 'number' && b < 0) {
        e = { error: b }
      }

      return cb(e, b)
    })
  }

  loadAttributes (cb) {
    this.checkStatus((err, res) => {
      if (err) return cb(err)
      const split = this.url.hash.split('!')
      let payload = { downloadId: split[1], key: split[2] }

      // folder or file

      if (split[0] === '#F') {
        if (!res.f) return cb({ error: 'unknown response' })

        const shareKey = crypto.base64ToA32(split[2])
        const files = res.f.map(f => {
          if (!f.k) return cb({ error: 'missing file key' })

          let key = f.k.split(':')[1]
          if (key.length < 46) {
            let k = crypto.base64ToA32(key) // short keys: AES
            let len = shareKey.length

            if (len === 4 || len === 6 || len === 8) {
              const decKey = crypto.decryptKey(shareKey, k)
              if (!decKey) return cb({ error: 'coult not get file key' })
              k = decKey

              let a = crypto.base64ToAb(f.a)
              a = crypto.decAttr(a, k)
              return { h: f.h, p: f.p, t: f.t, size: f.s, name: a.n }
            } else {
              cb({ error: 'wrong shared key size' })
            }
          }
        })

        let root = { }
        const sort = files.map((file, i) => {
          if (i === 0) {
            root.name = file.name
            root.files = files.filter(inside => (file.h === inside.p && inside.t !== 1))
          }

          if (file.t === 1 && i !== 0) {
            return {
              name: file.name,
              files: files.filter(inside => file.h === inside.p)
            }
          }
        }).filter(Boolean)

        root.folders = sort

        cb(null, extend(payload, root))
      } else if (split[0] === '#') {
        let at = res.at
        payload = extend(payload, { size: res.s })

        at = crypto.d64(at)
        this._getCipher(crypto.formatKey(payload.key)).decryptCBC(at)

        payload = extend(payload, { name: this._unpackAttributes(at).n })
        cb(null, payload)
      }
    })
  }

  _getCipher (key) {
    // 256 -> 128
    let k = new Buffer(16)
    for (let i = 0; i < 16; i++) {
      k.writeUInt8(key.readUInt8(i) ^ key.readUInt8(i + 16, true), i)
    }
    return new crypto.AES(k)
  }

  _unpackAttributes (at) {
    // remove empty bytes from end
    let end = at.length
    while (!at.readUInt8(end - 1)) end--
    at = at.slice(0, end).toString()
    if (at.substr(0, 6) !== 'MEGA{"') {
      throw new Error('Attributes could not be decrypted with provided key.')
    }
    return JSON.parse(at.substring(4))
  }
}
