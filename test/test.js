
import test from 'ava'
import { parse } from 'url'
import megaHelper from '../lib/index'

let directLink = ''
let folderLink = ''

test.before(t => {
  directLink = 'https://mega.nz/#!OZNRGKqD!8ZZrjUW9DPU0PH-b8LO-rXEzK_w5DrAXRcsIC387ce0'
  folderLink = 'https://mega.nz/#F!zdxXmIbR!x4qDlmCrqC1-WDiByhMwlg'
})

test('constructor', t => {
  t.is(typeof megaHelper, 'function')
})

test.cb('checkStatus LINK', t => {
  megaHelper(directLink).checkStatus((err, res) => {
    t.falsy(err)
    t.is(typeof res.s, 'number')
    t.is(typeof res.at, 'string')

    t.end()
  })
})

test.cb('checkStatus FOLDER', t => {
  megaHelper(folderLink).checkStatus((err, res) => {
    t.falsy(err)
    t.is(typeof res.f, 'object')

    t.end()
  })
})

test.cb('loadAttributes LINK', t => {
  const split = parse(directLink).hash.split('!')

  megaHelper(directLink).loadAttributes((err, res) => {
    t.falsy(err)
    t.is(typeof res.name, 'string')
    t.is(typeof res.size, 'number')
    t.deepEqual(res.downloadId, split[1])
    t.deepEqual(res.key, split[2])

    t.end()
  })
})

test.cb('loadAttributes FOLDER', t => {
  const split = parse(folderLink).hash.split('!')

  megaHelper(folderLink).loadAttributes((err, res) => {
    t.falsy(err)
    t.is(typeof res.name, 'string')
    t.is(typeof res.files, 'object')
    t.deepEqual(res.downloadId, split[1])
    t.deepEqual(res.key, split[2])

    t.end()
  })
})
