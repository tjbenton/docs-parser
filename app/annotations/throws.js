import { regex, list, markdown } from './annotation-utils'

/// @name @throws
/// @page annotations
/// @alias @throw, @exception, @error, @catch
/// @description
/// The error that happends if something goes wrong
/// @returns {hashmap}
/// @markup Usage
/// /// @throws {type}
///
/// /// @throws description
///
/// /// @throws {type} - description
///
/// /// @throws {type} description
///
/// /// @throws
/// /// multi
/// /// line
/// /// description
export default {
  alias: [ 'throw', 'exception', 'error', 'catch' ],
  parse() {
    let [ types, description ] = regex('throws', this.annotation.line)

    return [
      {
        types: list(types),
        description: markdown(description, this.annotation.contents)
      }
    ]
  }
}
