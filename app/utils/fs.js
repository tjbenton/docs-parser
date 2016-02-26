// File System
import path from 'path'
import fs from 'fs-extra'
import promisify from 'es6-promisify'

// @name fs.fakeCopy
// @description
// Creates an empty file temp file in the `.tmp/`. This is so that I can
// check to see if the source file has been updated.
fs.fakeCopy = (source, target, callback) => {
  source = path.parse(source)
  target = path.parse(target)

  // creates the directory path if it doesn't exist
  fs.mkdirp(path.resolve(source.dir, path.relative(source.dir, target.dir)), () => {
    fs.writeFile(path.join(target.dir, target.base), '', () => callback && callback())
  })
}


// The functions below are converted into promises
fs.readJson = promisify(fs.readJson)
fs.outputJson = promisify(fs.outputJson)
fs.stat = promisify(fs.stat)
fs.readFile = promisify(fs.readFile)
fs.ensureFile = promisify(fs.ensureFile)

export default fs
// export default promisify(fs)
