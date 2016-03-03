import { info, fs, is, to } from '../utils'
import path from 'path'
import getBlocks from './get-blocks'
import parseBlocks from './parse-blocks'
import replaceAliases from './replace-aliases'

export default async function parser({
  file_path,
  comments,
  annotations,
  blank_lines,
  sort,
  log
}) {
  // the filetype of the current file
  let type = path.extname(file_path).replace('.', '')

  // gets the comments to use on this file
  let comment = comments[type] ? comments[type] : comments._

  let contents = to.normalString(await fs.readFile(file_path))

  contents = replaceAliases({
    contents,
    annotations: annotations.list(type),
    comment,
    log
  })

  let file = {
    contents, // all of the contents of the file
    path: path.join(info.dir, path.relative(info.root, file_path)) || file_path, // path of the file
    name: path.basename(file_path, '.' + type), // name of the file
    type, // filetype of the file
    comment,
    start: 1, // starting point of the file
    end: to.array(contents).length // ending point of the file
  }

  // a) The file doesn't contain any header level comments, or body level comments
  if (
    !is.any.in(
      contents,
      ...to.values(comment.header).slice(0, -1),
      ...to.values(comment.body).slice(0, -1)
    )
  ) {
    console.log(`Well shitfire, '${file.path}' doesn't contain any sweet documentation`)
    return []
  }

  contents = '\n' + contents

  let header = getBlocks({
    file,
    contents,
    blank_lines,
    comment: comment.header
  })

  let body = getBlocks({
    file,
    contents,
    blank_lines,
    comment: comment.body,
    restrict: false,
    start_at: !is.empty(header) ? header[0].comment.end + 1 : 0
  })

  header = parseBlocks({
    file,
    blocks: header,
    annotations,
    comment,
    sort,
    log
  })[0] || {}

  body = parseBlocks({
    file,
    blocks: body,
    annotations,
    comment,
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
