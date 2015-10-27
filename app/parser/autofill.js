import { is, to } from '../utils'

// @name autofill
// @access private
// @description
// This function is used to run the all the functions that autofill if not defined.
export default function autofill(options) {
  let { autofill_list, parsed, block, log } = options

  let parsed_keys = to.keys(parsed)

  for (let [annotation, annotation_autofill] of to.entries(autofill_list)) {
    if (!is.in(parsed_keys, annotation)) {
      parsed[annotation] = is.fn(annotation_autofill) ? annotation_autofill.call(block) : annotation_autofill
    }
  }

  return parsed
}