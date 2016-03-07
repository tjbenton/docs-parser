'use strict'

import path from 'path'
import {
  info,
  to,
  fs,
  glob,
  Logger
} from './utils'
import parser from './parser'
import sorter from './sorter'
import getConfig from './config'
import { map } from 'async-array-methods'

////
/// @name docs.js
/// @author Tyler Benton
/// @description
/// This is used to parse any filetype that you want to and gets the
/// documentation for it  and returns an `{}` of the document data
////
export default async function docs(options = {}) {
  options = await getConfig(options)
  /* eslint-disable no-unused-vars */
  // these are all the options that can be used
  let {
    files,
    ignore,
    changed,
    blank_lines,
    page_fallback,
    debug,
    warning,
    timestamps,
    raw,
    sort,
    annotations,
    comments,
  } = options
  /* eslint-enable no-unused-vars */
  let log

  options.log = log = new Logger({ debug, warning, timestamps })

  log.emit('start', 'total')

  try {
    await fs.ensureFile(info.temp.file)
    let json = fs.readFile(info.temp.file)
    log.emit('start', 'paths')
    files = await glob(files, ignore, changed ? hasFileChanged : false)
    let s = files.length > 1 ? 's' : '' // eslint-disable-line
    log.emit('complete', 'paths', `%s completed after %dms with ${files.length} file${s} to parse`)

    log.emit('start', 'parser')
    files = await map(files, (file_path) => parser(file_path, options))
    log.emit('complete', 'parser')

    // converts json to a readable JS object
    json = changed ? to.string(await json) : false
    json = !!json ? to.object(json) : {}

    // Loop through the parsed files and update the
    // json data that was stored.
    for (let file of files) {
      to.extend(json, file)
    }

    // Update the temp json data. Even though this returns a promise
    // it's not returned below because there's no need to wait for it
    // to finish writing out the json file before moving on. Because the
    // `json` object has already been updated.
    fs.outputJson(info.temp.file, (changed ? json : {}), { spaces: 2 })
      .catch((err) => log.error(err.stack))

    if (!raw) {
      log.emit('start', 'sorter')
      json = sorter({ json, page_fallback, log })
      log.emit('complete', 'sorter')
    }

    log.emit('complete', 'total')
    return json
  } catch (err) {
    log.error(err.stack)
  }
}

// @name hasFileChanged
// @access private
// @description
// checks the status of the file to see if it has changed or not.
// @arg {string} - path to file
// @async
// @returns {boolean}
async function hasFileChanged(file) {
  let source = path.join(info.root, file)
  let target = path.join(info.temp.folder, file)

  try {
    let stats = await map([ source, target ], (_path) => fs.stat(_path))

    // copies new files over because it's changed
    if (stats[0].mtime > stats[1].mtime) {
      fs.fakeCopy(source, target)
      return true
    }

    return false
  } catch (err) {
    // copies new files over because it doesn't exist in the temp target directory
    fs.fakeCopy(source, target)
    return true
  }
}


// let logger = new Logger()
// process.on('uncaughtException', (err) => {
//   logger.error('An uncaughtException was found:', err)
//   console.trace(err)
//   process.exit(1)
// })
