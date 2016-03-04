import { multiple } from './annotation-utils'
/// @name @author
/// @alias @authors
/// @description Author of the documented item
/// @returns {string}
/// @markup Usage
/// /// @author Author's name
///
/// /// @author Author One, Author Two
///
/// /// @author Author One
/// /// @author Author Two
export default {
  alias: [ 'authors' ],
  parse() {
    return multiple(this.annotation)
  }
}
