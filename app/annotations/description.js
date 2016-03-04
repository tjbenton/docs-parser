import { markdown } from './annotation-utils'
/// @name @description
/// @alias @desc, @definition, @explanation, @writeup, @summary, @summarization
/// @description Description of the documented item
/// @note Runs through markdown
/// @returns {string}
/// @markup Usage
/// /// @description description
///
/// /// @description
/// /// # Long description.
/// /// Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed
/// /// do eiusmod tempor incididunt ut labore et dolore magna aliqua.
export default {
  alias: [
    'desc', 'definition', 'explanation',
    'writeup', 'summary', 'summarization'
  ],
  parse() {
    return markdown(this.annotation.line, this.annotation.contents)
  }
}
