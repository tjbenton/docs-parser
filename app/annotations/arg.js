import { markdown, regex, list } from './annotation-utils'

/// @name @arg
/// @description Parameters from the documented function/mixin
/// @note Description runs through markdown
/// @returns {object}
/// @markup Usage
/// /// @param {type} name
/// /// @param {type, othertype} name
/// /// @param {type} name - description
/// /// @param {type} name description
/// /// @param {type} name [default value] - description
export default {
  alias: [ 'argument', 'param', 'parameter' ],
  parse() {
    let [
      types = [],
      name = '',
      value = '',
      description = '',
    ] = regex('arg', this.annotation.line)

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
