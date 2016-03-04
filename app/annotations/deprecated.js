import { markdown, regex } from './annotation-utils'

/// @name @deprecated
/// @description Lets you know that a mixin/function has been depricated
/// @returns {object}
/// @markup Usage
/// /// @deprecated
///
/// /// @deprecated description
///
/// /// @deprecated {version} - description
///
/// /// @deprecated {version} description
///
/// /// @deprecated {version}
/// description
///
/// /// @deprecated {version} description
/// /// more of the description
export default {
  parse() {
    let [ version = '0', description ] = regex('deprecated', this.annotation.line)
    return {
      version,
      description: markdown(description, this.annotation.contents)
    }
  }
}
