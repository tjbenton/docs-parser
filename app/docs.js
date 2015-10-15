'use strict';

process.on('uncaughtException', function(err) {
  log.error('An uncaughtException was found:', err.stack)
  process.exit(1)
})

import {info, fs, to, log, glob, array} from './utils'
import AnnotationApi from './annotation'
import parser from './parser'
import sorter from './sorter'

////
/// @name docs.js
/// @author Tyler Benton
/// @description
/// This is used to parse any filetype that you want to and gets the
/// documentation for it  and returns an `{}` of the document data
////

import get_config from './config'
import co from 'co'
import path from 'path'

const docs = co.wrap(function*(user_config = {}) {
  log.time('total')
  let {
    files,
    ignore,
    changed,
    blank_lines,
    debug,
    timestamps,
    annotations,
    comments,
  } = yield get_config(user_config);

  let api = new AnnotationApi()

  try {
    yield fs.ensureFile(info.temp.file)
    let json = fs.readFile(info.temp.file)

    log.time('paths')
    files = yield glob(files, ignore, changed ? has_file_changed : false)
    log.timeEnd('paths', `%s completed after %dms with ${files.length} file${files.length > 1 ? 's': ''} to parse`)

    log.time('parser')
    files = yield array(files).map((file_path) => parser({ file_path, comments, api }))
    log.timeEnd('parser')

    // converts json to a readable JS object
    json = to.string(yield json)
    json = !!json ? JSON.parse(json) : {}

    // Loop through the parsed files and update the
    // json data that was stored.
    for (let i in files) {
      to.merge(json, files[i], false)
    }

    // Update the temp json data. Even though this returns a promise
    // it's not returned below because there's no need to wait for it
    // to finish writing out the json file before moving on. Because the
    // `json` object has already been updated.
    fs.outputJson(info.temp.file, json, { spaces: 2 })
      .catch((err) => log.error(err.stack))

    log.time('sorter')
    json = sorter(json)
    log.timeEnd('sorter')
    log.timeEnd('total')
    return json
  } catch(err) {
    log.error(err.stack)
  }
});



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
    fs.fake_copy(source, target);
    return true
  }
};