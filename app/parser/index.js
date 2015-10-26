import { info, fs, is, to } from '../utils'
import path from 'path'
import get_blocks from './get_blocks'
import parse_blocks from './parse_blocks'
import replace_aliases from './replace_aliases'

export default async function parser(options = {}) {
  let { file_path, comments, annotations, log } = options

  // the filetype of the current file
  let type = path.extname(file_path).replace('.', '')

  // gets the comments to use on this file
  let comment = comments[type] ? comments[type] : comments._

  let contents = to.normal_string(await fs.readFile(file_path))

  contents = replace_aliases({
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
    start: 0, // starting point of the file
    end: to.array(contents).length - 1 // ending point of the file
  }

  // a) The file doesn't contain any header level comments, or body level comments
  if (!is.any.in(contents,
      comment.header.start, comment.header.line, comment.header.end,
      comment.body.start, comment.body.line, comment.body.end)) {
    console.log(`Well shitfire, '${file.path}' doesn't contain any sweet documentation`)
    return []
  }


  let header = get_blocks({
    file,
    contents,
    comment: comment.header
  })

  let body = get_blocks({
    file,
    contents,
    comment: comment.body,
    restrict: false,
    start_at: !is.empty(header) ? header[0].comment.end + 1 : 0
  })

  header = parse_blocks({
    file,
    blocks: header,
    annotations,
    comment
  })[0] || {}

  body = parse_blocks({
    file,
    blocks: body,
    annotations,
    comment
  })

  return {
    [file.path]: { header, body }
  }
}