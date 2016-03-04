import { regex, list, markdown } from './annotation-utils'

/// @name @todo
/// @page annotations
/// @description Things to do related to the documented item
/// @returns {object}
/// // todo - {5} [assignee-one, assignee-two] - Task to be done
/// @mrkup Usage
/// /// @todo description
///
/// /// @todo {importance} - description
///
/// /// @todo {importance} [assignee[, assignee]] - description
///
/// /// @todo {importance} [assignee[, assignee]] description
///
/// /// @todo {importance} [assignee[, assignee]]
/// /// multi
/// /// line
/// /// description
export default {
  parse() {
    let [
      importance = '0',
      assignees,
      description
    ] = regex('todo', this.annotation.line)

    return [
      {
        importance,
        assignees: list(assignees),
        description: markdown(description, this.annotation.contents)
      }
    ]
  }
}
