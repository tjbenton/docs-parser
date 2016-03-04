import { toBoolean, multiple } from './annotation-utils'

/// @name @chainable
/// @page annotations
/// @alias @chain
/// @description Used to notate that a function is chainable
/// @returns {boolean, array}
/// @markup Usage
/// // this will return true
/// /// @chainable
///
/// /// @chainable false
///
/// /// @chainable true
///
/// /// @chainable jQuery
///
/// /// @chainable Something, Something else
export default {
  alias: [ 'chain' ],
  parse() {
    let bool = toBoolean(this.annotation)

    if (bool !== undefined) {
      return bool
    }

    return multiple(this.annotation)
  }
}
