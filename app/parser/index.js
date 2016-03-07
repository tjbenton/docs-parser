import { info, fs, is, to } from '../utils'
import path from 'path'
import getBlocks from './get-blocks'
import parseBlocks from './parse-blocks'
import replaceAliases from './replace-aliases'
import clor from 'clor'

export default async function parser(file_path, {
  languages,
  annotations,
  blank_lines,
  sort,
  log
}) {
  // the filetype of the current file
  const type = path.extname(file_path).replace('.', '')

  // gets the comments to use on this file
  const options = languages[type] ? languages[type] : languages.default

  const contents = '\n' + to.normalString(await fs.readFile(file_path))

  let file = {
    contents, // all of the contents of the file
    path: path.join(info.dir, path.relative(info.root, file_path)) || file_path, // path of the file
    name: path.basename(file_path, `.${type}`), // name of the file
    type, // filetype of the file
    options,
    start: 1, // starting point of the file
    end: to.array(contents).length - 1 // ending point of the file
  }

  file.contents = replaceAliases({ file, annotations })

  // a) The file doesn't contain any header level comments, or body level comments
  if (
    !is.any.in(
      file.contents,
      ...to.values(file.options.header).slice(0, -1),
      ...to.values(file.options.body).slice(0, -1)
    )
  ) {
    log.emit('warning', `Well shitfire, ${clor.bold(file.path)} doesn't contain any sweet documentation`)
    return []
  }

  let header = getBlocks({
    file,
    blank_lines,
    comment: file.options.header
  })

  let body = getBlocks({
    file,
    blank_lines,
    comment: file.options.body,
    restrict: false,
    start_at: !is.empty(header) ? header[0].comment.end + 1 : 0
  })

  header = parseBlocks({
    file,
    blocks: header,
    annotations,
    sort,
    log
  })[0] || {}

  body = parseBlocks({
    file,
    blocks: body,
    annotations,
    sort,
    log
  })

  return {
    [file.path]: { header, body }
  }
}

export {
  getBlocks,
  parseBlocks,
  replaceAliases
}
