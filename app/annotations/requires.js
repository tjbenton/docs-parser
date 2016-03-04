import { regex, list, markdown } from './annotation-utils'

/// @name @requires
/// @alias @require
/// @description Requirements from the documented item
/// @returns {object}
///
/// @markup Usage
/// /// @requires {type[, type]}
///
/// /// @requires name
///
/// /// @requires description
///
/// /// @requires {type[, type]} name - description
///
/// /// @requires {type[, type]} name description
export default {
  alias: [ 'require' ],
  parse() {
    let [ types, name = '', description ] = regex('requires', this.annotation.line)

    return [
      {
        types: list(types),
        name,
        description: markdown(description, this.annotation.contents)
      }
    ]
  }
}
