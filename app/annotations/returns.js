import { regex, list, markdown } from './annotation-utils'

/// @name @returns
/// @alias @return
/// @description Return from the documented function
/// @returns {string}
/// @markup Usage
/// /// @returns
///
/// /// @returns {type[, type]}
///
/// /// @returns {type[, type]} - description
///
/// /// @returns {type[, type]} description
///
/// /// @returns {type[, type]}
/// /// multi
/// /// line
/// /// description
export default {
  alias: [ 'return' ],
  parse() {
    let [ types, description ] = regex('returns', this.annotation.line)

    if (
      types == null ||
      types === ''
    ) {
      types = 'undefined'
    }

    return {
      types: list(types),
      description: markdown(description, this.annotation.contents)
    }
  }
}
