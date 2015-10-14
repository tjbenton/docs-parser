// File System
import path from 'path'
import denodeify from './denodeify.js'
import fs from 'fs-extra'

// @name fs.fake_copy
// @description
// Creates an empty file temp file in the `.tmp/`. This is so that I can
// check to see if the source file has been updated.
fs.fake_copy = (source, target, callback) => {
  var cbCalled = false,
      source = path.parse(source),
      target = path.parse(target);

  // creates the directory path if it doesn't exist
  fs.mkdirp(path.resolve(source.dir, path.relative(source.dir, target.dir)), () => {
    fs.writeFile(path.join(target.dir, target.base), '', () => callback && callback())
  })
}

// The functions below are converted into promises
fs.readJson = denodeify(fs.readJson)
fs.outputJson = denodeify(fs.outputJson)
fs.stat = denodeify(fs.stat)
fs.readFile = denodeify(fs.readFile)
fs.ensureFile = denodeify(fs.ensureFile)

export default fs