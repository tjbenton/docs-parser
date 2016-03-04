import { regex, markdown } from './annotation-utils'

/// @name @note
/// @page annotations
/// @alias @notes
/// @description A note about the documented item
/// @returns {object}
///
/// @markup Usage
/// /// @note description
///
/// /// @note {importance} description
///
/// /// @note {importance}
/// /// multi
/// /// line
/// /// description
export default {
  alias: [ 'notes' ],
  parse() {
    let [ importance = '0', description ] = regex('note', this.annotation.line)

    return [
      {
        importance,
        description: markdown(description, this.annotation.contents)
      }
    ]
  }
}
