import { is, to } from '../utils'

/// @name aliases
/// @access private
/// @description
/// This function is used to replace all instances of aliases in a file
/// @returns {string} - The file with the instances of aliases removed
export default function aliases(options = {}) {
  let { contents, annotations, comment } = options /* , log */

  let main_annotation_list = to.keys(annotations)

  annotations = to.map(annotations, (annotation, name) => {
    if (is.truthy(annotation.alias) && !is.empty(annotation.alias)) {
      return { [name]: annotation.alias }
    }

    return false
  })

  for (let [ annotation, alias_list ] of to.entries(annotations)) {
    // filter out any aliases that are already in the main annotation list
    alias_list = alias_list.filter((alias) => !is.in(main_annotation_list, alias))

    const alias_list_regex = new RegExp(`(?:${comment.prefix})(${alias_list.join('|')})\\b`, 'g')
    contents = contents.replace(alias_list_regex, comment.prefix + annotation + ' ')
  }

  return contents
}
