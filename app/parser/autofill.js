import { is, to } from '../utils'

// @name autofill
// @access private
// @description
// This function is used to run the all the functions that autofill if not defined.
export default function autofill({ list, parsed, block/* , log */ }) {
  let parsed_keys = to.keys(parsed)

  for (let [ annotation, annotation_autofill ] of to.entries(list)) {
    if (!is.in(parsed_keys, annotation)) {
      const result = is.fn(annotation_autofill) ? annotation_autofill.call(block) : annotation_autofill
      if (result != null) {
        parsed[annotation] = result
      }
    }
  }

  return parsed
}
