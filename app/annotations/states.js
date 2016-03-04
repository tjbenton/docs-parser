import { is, to } from '../utils'
import { regex, markdown } from './annotation-utils'

/// @name @states
/// @page annotations
/// @alias @state
/// @description A state of a the documented item
/// @returns {hashmap}
/// @note {10} This annotation must be used with @markup
/// @markup Usage
/// /// @state {state}
/// /// @state {state}
/// /// @state {state}
/// /// @state {state}
///
/// /// @state (id) {state} [state_id] - description
/// /// @state (id) {state} [state_id] - description
/// /// @state (id) {state} [state_id] - description
///
/// /// @state (id)
/// /// {state} - description
/// /// {state} - description
/// /// {state} - description
///
/// /// @states (id)
/// /// {state} [state_id] - description
/// /// {state} [state_id] - description
/// /// {state} [state_id] - description
export default {
  alias: [ 'state' ],
  parse() {
    let [ markup_id = null, state_line ] = regex('state_id', this.annotation.line)
    let state = [ state_line, ...to.array(this.annotation.contents) ].filter(Boolean)

    state = state.reduce((previous, current, i) => {
      let [ state = '', id = `${i}`, description = '' ] = regex('state', current) // eslint-disable-line
      return to.extend(previous, {
        [id]: { state, description: markdown(description) }
      })
    }, {})

    Object.defineProperty(state, '__details', { __proto__: null, value: this })

    return [ { markup_id, state } ]
  },
  resolve({ parsed, block, log }) {
    return this.reduce((previous, { markup_id, state }) => {
      let markup
      let start_at = state.__details.annotation.start

      // throw an error because a state should always be accompanied by a `@markup` block
      if (!parsed.markup) {
        log.emit('error', "There's no instance of a '@markup' annotation")
      } else if (is.falsy(markup_id)) {
        markup = findMarkupAfter(parsed.markup, start_at)
        markup_id = markup.id

        if (!markup) {
          log.emit('error', to.normalize(`
            There's no instance of a '@markup' annotation after line ${block.comment.start + start_at}
            in ${block.file.path}
          `))
        }
      } else {
        markup = findMarkupById(parsed.markup, markup_id)
        if (!markup) {
          log.emit('error', to.normalize(`
            There's no instance of a '@markup' annotation with an id of ${markup_id}
            in ${block.file.path}
          `))
        }
      }

      // return just the state and a empty markup block
      // because a markup block wasn't found
      if (!markup) {
        return to.merge(previous, {
          [markup_id]: [ { state, markup: {} } ]
        })
      }


      // filter out the `raw_stateless`, and `escaped_stateless` keys because this is
      // a state so it shouldn't have a stateless instance
      markup = to.filter(to.clone(markup), ({ key }) => !is.in(key, 'state'))

      // this allows users to specify interpolations like `@state.description`
      // without affecting the actual state output
      let _state = to.clone(state)
      to.extend(_state, _state[to.keys(_state)[0]])
      markup.raw = replaceStates(markup.raw, _state)
      markup.escaped = replaceStates(markup.escaped, _state)

      return to.merge(previous, {
        [markup_id]: [ { state, markup } ]
      })
    }, {})
  }
}


function replaceStates(str, states) {
  // @todo {5} - Update this to use language settings
  //  - annotation name and it's aliases
  //  - interpolation
  //  - annotation prefix
  // const state_interpolation = new RegExp(`${settings.interpolation.start}${settings.annotation.prefix}etc....`, 'gi')
  const state_interpolation = /\${@(?:state|states)[^\}]*\}/g
  return str.replace(state_interpolation, (original_match) => {
    let match = original_match.replace(/\${@(?:states|state)|}/g, '').slice(1)

    if (!match) {
      return states.state
    }

    let dot_index = match.indexOf('.')
    let bracket_index = match.indexOf('[')
    let index = dot_index > bracket_index ? dot_index : bracket_index

    if (index > -1) {
      let key = clean(match.slice(0, index))
      let item = clean(match.slice(index))
      return (states[key] || {})[item]
    }

    return states[clean(match)]
  })
}

function clean(str) {
  return str.replace(/[\[\]\.]/g, '')
}

function findMarkupById(markup, id) {
  for (let item of markup) {
    if (item.id === id) {
      return item
    }
  }
  return
}

function findMarkupAfter(markup, start_at) {
  for (let markup_block of markup) {
    if (start_at < markup_block.__details.annotation.start) {
      return markup_block
    }
  }
  return
}
