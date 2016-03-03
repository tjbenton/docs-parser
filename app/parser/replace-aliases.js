import { is, to } from '../utils'

/// @name aliases
/// @access private
/// @description
/// This function is used to replace all instances of aliases in a file
/// @returns {string} - The file with the instances of aliases removed
export default function aliases(options = {}) {
  let { file, annotations, comment } = options /* , log */

  let main_annotation_list = to.keys(annotations.list(file.type))

  let comment_types = [
    to.values(comment.header, '!type', '!end'),
    to.values(comment.body, '!type', '!end')
  ]

  comment_types = to.flatten(comment_types)
    .filter(Boolean)
    .map((comment_type) => '\\' + comment_type.split('').join('\\'))
  comment_types = `(?:${comment_types.join('|')})`
  let block_comment = `(?:^(?:\\s*${comment_types})?\\s*)`
  let inline_comment = `(?:${comment_types}?${comment.inline_prefix}\\s+)`
  let comment_regex = `((?:${block_comment}|${inline_comment})${comment.prefix})`

  let alias_obj = to.reduce(annotations.list(file.type, 'alias'), (previous, { key, value }) => {
    value = value
      .filter((alias) => !is.in(main_annotation_list, alias))
      .reduce((a, b) => to.extend(a, { [b]: key }), {})
    return to.extend(previous, value)
  }, {})

  const alias_list_regex = new RegExp(`${comment_regex}(${to.keys(alias_obj).join('|')})\\b`, 'gm')

  return file.contents.replace(alias_list_regex, (match, comment_match, alias) => comment_match + alias_obj[alias])
}
