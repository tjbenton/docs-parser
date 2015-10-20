'use strict';

process.on('uncaughtException', function(err) {
  log.error('An uncaughtException was found:', err.stack)
  process.exit(1)
})

import co from 'co'
import path from 'path'
import { info, fs, is, to, glob, array, Logger } from './utils'
import parser from './parser'
import sorter from './sorter'
import reporter from './reporter'
import get_config from './config'

let log = new Logger();
reporter.call(log)

////
/// @name docs.js
/// @author Tyler Benton
/// @description
/// This is used to parse any filetype that you want to and gets the
/// documentation for it  and returns an `{}` of the document data
////
const docs = co.wrap(function*(options = {}) {
  log.emit('start', 'total')
  options = yield get_config(options)
  let {
    files,
    ignore,
    changed,
    blank_lines,
    debug,
    timestamps,
    annotations,
    comments,
  } = options


  try {
    yield fs.ensureFile(info.temp.file)
    let json = fs.readFile(info.temp.file)
    log.emit('start', 'paths')
    files = yield glob(files, ignore, changed ? has_file_changed : false)
    log.emit('complete', 'paths', `%s completed after %dms with ${files.length} file${files.length > 1 ? 's' : ''} to parse`)

    log.emit('start', 'parser')
    files = yield array(files).map((file_path) => parser({ file_path, ...options, log }))
    log.emit('complete', 'parser')

    // converts json to a readable JS object
    json = to.string(yield json)
    json = !!json ? to.object(json) : {}

    // Loop through the parsed files and update the
    // json data that was stored.
    for (let i in files) to.extend(json, files[i])

    // Update the temp json data. Even though this returns a promise
    // it's not returned below because there's no need to wait for it
    // to finish writing out the json file before moving on. Because the
    // `json` object has already been updated.
    fs.outputJson(info.temp.file, json, { spaces: 2 })
      .catch((err) => log.error(err.stack))

    log.emit('complete', 'total')
    return json
  } catch(err) {
    log.error(err.stack)
  }
})

export default docs

// @name has_file_changed
// @access private
// @description
// checks the status of the file to see if it has changed or not.
// @arg {string} - path to file
// @async
// @returns {boolean}
async function has_file_changed(file) {
  let source = path.join(info.root, file)
  let target = path.join(info.temp.folder, file)

  try {
    let stats = await array([source, target]).map((_path) => fs.stat(_path))

    // copies new files over because it's changed
    if (stats[0].mtime > stats[1].mtime) {
      fs.fake_copy(source, target)
      return true
    } else {
      return false
    }
  } catch(err) {
    // copies new files over because it doesn't exist in the temp target directory
    fs.fake_copy(source, target)
    return true
  }
}