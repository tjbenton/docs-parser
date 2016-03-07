'use strict'

import path from 'path'
import {
  info,
  to,
  fs,
  glob,
} from './utils'
import parser from './parser'
import sorter from './sorter'
import getConfig from './config'
import { map } from 'async-array-methods'
import chokidar from 'chokidar'
import clor from 'clor'

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
    files: initial_files,
    ignore,
    blank_lines,
    page_fallback,
    debug,
    warning,
    timestamps,
    raw,
    sort,
    annotations,
    watch,
    languages,
    log,
  } = options
  /* eslint-enable no-unused-vars */

  let json = {}
  let ignored

  let walk = async (files) => {
    files = to.array(files)

    log.emit('start', 'total')
    try {
      log.emit('start', 'paths')
      ignored = await glob(ignore)
      files = await glob(files, ignored)

      let paths_message = `%s completed ${to.map(files, (file) => clor.bold(path.join(info.dir, file))).join(', ')} after %dms`
      if (files.length > 3) {
        let s = files.length > 1 ? 's' : '' // eslint-disable-line
        paths_message = `%s completed after %dms with ${files.length} file${s} to parse`
      }
      log.emit('complete', 'paths', paths_message)

      log.emit('start', 'parser')
      files = await map(files, (file_path) => parser(file_path, options))


      log.emit('complete', 'parser')

      // Loop through the parsed files and update the
      // json data that was stored.
      for (let file of files) {
        to.extend(json, file)
      }

      let result = json

      if (!raw) {
        log.emit('start', 'sorter')
        result = sorter({ json, page_fallback, log })
        log.emit('complete', 'sorter')
      }

      log.emit('complete', 'total')
      timestamps && log.space()

      return result
    } catch (err) {
      log.error(err.stack)
    }
  }

  let result = await walk(initial_files)

  if (!watch) {
    return result
  }

  let watcher = chokidar.watch(initial_files, { ignored, persistent: true, ignoreInitial: true })

  log.space()
  log.print('Watching', to.map(initial_files, (file) => clor.bold(file)).join(', '))
  log.print('Excluding', to.map(ignore, (file) => clor.bold(file)).join(', '))
  log.space()

  watcher.on('all', async (type, file) => {
    if (type === 'add' || type === 'changed') {
      try {
        await walk(file)
      } catch (err) {
        log.emit('error', file, 'was not updated', err)
      }
    }
  })
}
