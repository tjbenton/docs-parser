import { markdown, regex, list } from './annotation-utils'

/// @name @property
/// @page annotations
/// @description A property from the documented object/array
/// @note Description runs through markdown
/// @returns {object}
/// @markup Usage
/// /// @property {type} name
/// /// @property {type, othertype} name
/// /// @property {type} name - description
/// /// @property {type} name description
/// /// @property {type} name [key list] - description
export default {
  alias: [ 'prop', 'key' ],
  parse() {
    let [
      types = [],
      name = '',
      value = '',
      description = '',
    ] = regex('property', this.annotation.line)

    return [
      {
        types: list(types),
        name,
        value,
        description: markdown(description, this.annotation.contents)
      }
    ]
  }
}
