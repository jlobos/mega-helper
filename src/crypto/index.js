
import sjcl from './sjcl'
import CryptoJS from 'crypto-js'

export const base64ToAb = a => strToAb(base64urldecode(a))
export const base64ToA32 = s => strToA32(base64urldecode(s))

export function decryptKey (sharekey, a) {
  let x = []

  for (var i = 0; i < a.length; i += 4) {
    x = x.concat(CryptoJS.AES.decrypt(
      CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.lib.WordArray.create([a[i], a[i + 1], a[i + 2], a[i + 3]])
      }),
      CryptoJS.lib.WordArray.create(sharekey), {
        iv: CryptoJS.lib.WordArray.create([0, 0, 0, 0]),
        padding: {
          pad: function () {},
          unpad: function () {}
        }
      }).words)
  }

  return x
}

export function decAttr (attr, key) {
  attr = CryptoJS.enc.Latin1.parse(attr).words

  key = CryptoJS.lib.WordArray.create(
    [key[0] ^ key[4], key[1] ^ key[5], key[2] ^ key[6], key[3] ^ key[7]]
  )

  let iv = CryptoJS.lib.WordArray.create([0, 0, 0, 0])

  attr = a32ToAb(CryptoJS.AES.decrypt(
    CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.lib.WordArray.create(attr),
      iv: iv,
      key: key
    }), key, {
      iv: iv,
      padding: {
        pad: function () {},
        unpad: function () {}
      }
    }
  ).words)

  let b = String.fromCharCode.apply(null, attr).replace(/\0/g, '')

  if (b.substr(0, 6) !== 'MEGA{"') { throw Error('decryption failed') }
  return JSON.parse(from8(b.substr(4)))
}

function strToA32 (b) {
  let a = Array((b.length + 3) >> 2)
  for (let i = 0; i < b.length; i++) a[i >> 2] |= (b.charCodeAt(i) << (24 - (i & 3) * 8))
  return a
}

function base64urldecode (data) {
  data += '=='.substr((2 - data.length * 3) & 3)
  data = data.replace(/\-/g, '+').replace(/_/g, '/').replace(/,/g, '')
  // return Uint8Array
  return String.fromCharCode.apply(null, Buffer(data, 'base64'))
}

function a32ToAb (a) {
  let ab = new Array(4 * a.length)

  for (let i = 0; i < a.length; i++) {
    ab[4 * i] = a[i] >>> 24
    ab[4 * i + 1] = a[i] >>> 16 & 255
    ab[4 * i + 2] = a[i] >>> 8 & 255
    ab[4 * i + 3] = a[i] & 255
  }

  return ab
}

const from8 = utf8 => decodeURIComponent(escape(utf8))
const strToAb = b => (b += Array(16 - ((b.length - 1) & 15)).join(String.fromCharCode(0)))

// https://github.com/tonistiigi/mega

export function formatKey (key) {
  return typeof key === 'string' ? exports.d64(key) : key
}

export function d64 (s) {
  s += '=='.substr((2 - s.length * 3) & 3)
  s = s.replace(/\-/g, '+').replace(/_/g, '/').replace(/,/g, '')
  return new Buffer(s, 'base64')
}

export class AES {
  constructor (key) {
    var a32 = []
    for (var i = 0; i < 4; i++) a32[i] = key.readInt32BE(i * 4)
    this.aes = new sjcl.aes(a32)
  }

  decryptCBC (buffer) {
    let iv = [0, 0, 0, 0]
    let d = Array(4)
    let t = Array(4)
    let i, j

    for (i = 0; i < buffer.length; i += 16) {
      for (j = 0; j < 4; j++) {
        d[j] = buffer.readUInt32BE(i + j * 4, false)
      }
      t = d

      d = this.aes.decrypt(d)

      for (j = 0; j < 4; j++) {
        buffer.writeInt32BE(d[j] ^ iv[j], i + j * 4, false)
      }
      iv = t
    }
  }
}
