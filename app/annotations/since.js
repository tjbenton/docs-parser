import { regex, markdown } from './annotation-utils'

/// @name @since
/// @description Let's you know what version of the project a something was added
/// @returns {string}
/// @markup Usage
/// /// @since {version}
///
/// /// @since {version} - description
///
/// /// @since {version} description
///
/// /// @since {version}
/// /// multi
/// /// line
/// /// description
export default {
  parse() {
    let [ version = 'undefined', description ] = regex('since', this.annotation.line)

    return {
      version,
      description: markdown(description, this.annotation.contents)
    }
  }
}
