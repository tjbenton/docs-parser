import { regex, markdown, logAnnotationError } from './annotation-utils'
import clor from 'clor'

/// @name @type
/// @description Describes the type of a variable
/// @returns {object}
/// @markup Usage
/// /// @type {type}
///
/// /// @type {type} description
///
/// /// @type {type} - description
///
/// /// @type {type}
/// /// multi
/// /// line
/// /// description
export default {
  parse() {
    let [ type, description ] = regex('type', this.annotation.line)

    if (!type) {
      this.log.emit(
        'warning',
        `You didn't pass in a type to ${clor.bold('@type')}`,
        logAnnotationError(this, `@type {type}${description ? ' - ' + description : ''}`)
      )
      type = 'undefined'
    }

    return {
      type,
      description: markdown(description, this.annotation.contents)
    }
  }
}
