import { logAnnotationError, regex, markdown } from './annotation-utils'
import clor from 'clor'

/// @name @version
/// @description Describes the type of a variable
/// @returns {string}
/// @markup Usage
/// /// @version {version}
///
/// /// @version {version} - description
///
/// /// @version {version} description
///
/// /// @version {version}
/// /// multi
/// /// line
/// /// description
export default {
  parse() {
    let [ version, description ] = regex('version', this.annotation.line)

    if (!version) {
      this.log.emit(
        'warning',
        `You didn't pass in a version to ${clor.bold('@version ')}`,
        logAnnotationError(this, `@version {version}${description ? ' - ' + description : ''}`)
      )
      version = 'undefined'
    }

    return {
      version,
      description: markdown(description, this.annotation.contents)
    }
  }
}
