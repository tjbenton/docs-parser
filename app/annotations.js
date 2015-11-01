import { is, to } from './utils'

// holds all the base regex expressions for the annotations
// They're broken down so they can be reused instead of writing the same
// regexp over and over with slightly different variations
let regexes

{
  const types = '(?:{(.*)})?'
  const name = '([^\\s]*)?'
  const space = '(?:\\s*)?'
  const value = '(?:\\[(.*)\\])?'
  const id = '(?:\\((.*)\\))?'
  const description = '(?:\\-?\\s*)?(.*)?'

  regexes = {
    arg: new RegExp(types + space + name + space + value + space + description, 'i'),
    deprecated: new RegExp(types + space + description, 'i'),
    markup: new RegExp(id + space + types + space + value + space + description, 'i'),
    note: new RegExp(types + space + description, 'i'),
    requires: new RegExp(types + space + name + description, 'i'),
    returns: new RegExp(types + space + description, 'i'),
    state_id: new RegExp(`${id}${space}(.*)`, 'i'),
    state: new RegExp(types + space + value + space + description, 'i'),
    todo: new RegExp(types + space + value + space + description, 'i'),
    type: new RegExp(types + space + description, 'i'),
    version: new RegExp(types + space + description, 'i'),
  }
}


function list(str) {
  return to.array(str, ',').map((item) => item.trim()).filter(Boolean)
}

function regex(name, str) {
  return regexes[name].exec(str).slice(1)
}

function _markdown(...args) {
  return to.markdown([...args].filter(Boolean).join('\n'))
}


////
/// @name Annotations
/// @page annotations
/// @description
/// These are the default annotations for the docs
////
const annotations = {
  /// @name @access
  /// @description
  /// Access of the documented item. If access isn't declared then it defaults to public.
  /// @markup Usage
  /// /// @access public
  /// /// @access private
  access: {
    autofill() {
      return 'public'
    },
    parse() {
      if (this.annotation.line === 'private') {
        return 'private'
      }

      return 'public'
    }
  },

  /// @name @alias
  /// @description Whether the documented item is an alias of another item
  /// @returns {string}
  /// @markup Usage
  alias: {
    parse() {
      return list(this.annotation.line)
    }
  },

  /// @name @arg
  /// @page annotations
  /// @description Parameters from the documented function/mixin
  /// @note Description runs through markdown
  /// @returns {object}
  arg: {
    alias: ['argument', 'param', 'parameter'],
    parse() {
      let [
        types,
        name,
        value,
        description
      ] = regex('arg', this.annotation.line)

      return [{
        types: list(types),
        name,
        value,
        description: _markdown(description, this.annotation.contents)
      }]
    }
  },

  /// @name @author
  /// @page annotations
  /// @description Author of the documented item
  /// @returns {string}
  author: {
    alias: ['authors'],
    parse() {
      return list(this.annotation.line)
    }
  },

  /// @name @chainable
  /// @page annotations
  /// @description Used to notate that a function is chainable
  /// @returns {boolean}
  chainable: {
    parse() {
      return this.annotation.line
    }
  },

  /// @name @deprecated
  /// @page annotations
  /// @description Lets you know that a mixin/function has been depricated
  /// @returns {string}
  deprecated: {
    parse() {
      let [ version, description ] = regex('deprecated', this.annotation.line)
      return {
        version: version,
        description: _markdown(description, this.annotation.contents)
      }
    }
  },

  /// @name @description
  /// @page annotations
  /// @description Description of the documented item
  /// @note Runs through markdown
  /// @returns {string}
  description: {
    alias: ['desc', 'definition', 'explanation', 'writeup', 'summary', 'summarization'],
    parse() {
      return _markdown(this.annotation.line, this.annotation.contents)
    }
  },

  markdown: {
    filetypes: ['markdown', 'mark', 'mdown', 'mkdn', 'md', 'mdml', 'mkd', 'mdwn', 'mdtxt', 'mdtext', 'text'],
    parse() {
      return to.markdown(this.file.contents)
    }
  },
  /// @name @markup
  /// @page annotations
  /// @description Code for the documented item
  /// @note Description is parsed as markdown
  /// @returns {object}
  /// // markdown - `(id) {language} [settings] - description`
  markup: {
    alias: ['code', 'example', 'output', 'outputs'],
    parse() {
      let escaped_characters = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#39;'
      }

      let [
        id = false,
        language = this.file.type,
        settings = {},
        description
      ] = regex('markup', this.annotation.line)

      let raw = this.annotation.contents;

      let escaped = raw.split('\n').map((line) => line.replace(/[&<>'"]/g, (m) => escaped_characters[m])).join('\n');

      if (is.string(settings)) {
        settings = to.object(list(settings).map((setting) => setting.split('=')))
      }

      return [{
        id,
        language,
        settings,
        description: _markdown(description),
        raw,
        escaped
      }]
    }
  },

  /// @name @name
  /// @page annotations/name
  /// @description Name of the documented item
  /// @returns {string}
  name: {
    alias: ['title', 'heading']
  },

  /// @name @note
  /// @page annotations
  /// @description A note about the documented item
  /// @returns {object}
  note: {
    parse() {
      let [ importance, description ] = regex('note', this.annotation.line)

      return [{
        importance,
        description: _markdown(description, this.annotation.contents)
      }]
    }
  },

  /// @name @page
  /// @page annotations
  /// @description The page you want the documented item to be on
  /// @returns {string}
  page: {
    alias: ['group'],
    parse() {
      return list(this.annotation.line)
    }
  },

  /// @name @readonly
  /// @page annotations
  /// @description To note that a property is readonly
  /// @returns {boolean}
  readonly: {
    parse() {
      return true
    }
  },

  /// @name @requires
  /// @page annotations
  /// @description Requirements from the documented item
  /// @returns {object}
  requires: {
    alias: ['require'],
    parse() {
      let [ types, name, description ] = regex('requires', this.annotation.line)

      return [{
        types: list(types),
        name,
        description: _markdown(description, this.annotation.contents)
      }]
    }
  },

  /// @name @returns
  /// @page annotations
  /// @description Return from the documented function
  /// @returns {string}
  returns: {
    alias: ['return'],
    parse() {
      let [ types, description ] = regex('returns', this.annotation.line)

      return {
        types: list(types),
        description: _markdown(description, this.annotation.contents)
      }
    }
  },

  /// @name @since
  /// @page annotations
  /// @description Let's you know what version of the project a something was added
  /// @returns {string}
  since: {
    parse() {
      let [ types, description ] = regex('since', this.annotation.line)

      return {
        types: list(types),
        description: _markdown(description, this.annotation.contents)
      }
    }
  },

  /// @name @state
  /// @page annotations
  /// @description A state of a the documented item
  /// @returns {object}
  /// // state - `{state} - description`
  state: {
    parse() {
      let [ id, description ] = regex('state', this.annotation.line)

      return [{
        id,
        description: _markdown(description, this.annotation.contents)
      }]
    }
  },

  /// @name @todo
  /// @page annotations
  /// @description Things to do related to the documented item
  /// @returns {object}
  /// // todo - {5} [assignee-one, assignee-two] - Task to be done
  todo: {
    parse() {
      let [ importance, assignees, description ] = regex('todo', this.annotation.line)

      return [{
        importance,
        assignees: list(assignees),
        description: _markdown(description, this.annotation.contents)
      }]
    }
  },

  /// @name @throws
  /// @description
  /// The error that happends if something goes wrong
  throws: {
    alias: ['throws', 'exception', 'error'],
    parse() {
      return [join(this.annoation.line, this.annoation.content)]
    }
  },

  /// @name @type
  /// @page annotations
  /// @description Describes the type of a variable
  /// @returns {string}
  /// // type - `{type} - description`
  type: {
    parse() {
      let [ type, description ] = regex('type', this.annotation.line)
      return {
        type,
        description: _markdown(description, this.annotation.line)
      }
    }
  },

  /// @name @version
  /// @page annotations
  /// @description Describes the type of a variable
  /// @returns {string}
  /// // version `{type} - description`
  version: {
    parse() {
      let [ version, description ] = regex('version', this.annotation.line)
      return {
        version,
        description: _markdown(description, this.annotation.line)
      }
    }
  }
}

export default annotations