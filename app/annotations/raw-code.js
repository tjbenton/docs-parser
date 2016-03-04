import { escape } from './annotation-utils'

/// @name @raw-code
/// @page annotations
/// @description
/// This will output the raw code below the comment block
/// @returns {object}
export default {
  parse() {
    return {
      raw: this.code.contents,
      escaped: escape(this.code.contents)
    }
  }
}
