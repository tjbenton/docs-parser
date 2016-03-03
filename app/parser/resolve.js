import { is, to } from '../utils'

// @name autofill
// @access private
// @description
// This function is used to run the all the functions that autofill if not defined.
export default function resolve(options) {
  let { resolve_list, parsed, block, log } = options

  let parsed_keys = to.keys(parsed)

  for (let [ annotation, annotation_resolve ] of to.entries(resolve_list)) {
    if (is.in(parsed_keys, annotation)) {
      let result = annotation_resolve
      if (is.fn(annotation_resolve)) {
        result = annotation_resolve.call(parsed[annotation], { parsed, block, log })
      }

      if (result != null) {
        parsed[annotation] = result
      }
    }
  }

  return parsed
}