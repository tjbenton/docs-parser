import { is, to } from './utils'
import clor from 'clor'

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
  const description = '(?:\\s*\\-?\\s+)?(.*)?'

  regexes = {
    arg: new RegExp(types + space + name + space + value + space + description, 'i'),
    deprecated: new RegExp(types + space + description, 'i'),
    markup: new RegExp(id + space + types + space + value + space + description, 'i'),
    note: new RegExp(types + space + description, 'i'),
    throws: new RegExp(types + space + description, 'i'),
    requires: new RegExp(types + space + name + description, 'i'),
    returns: new RegExp(types + space + description, 'i'),
    since: new RegExp(types + space + description, 'i'),
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

function multiple(annotation) {
  return to.flatten([
    ...(annotation.line.split(',')),
    ...(annotation.contents.split('\n').map((item) => item.split(',')))
  ])
  .map((author) => author.trim())
  .filter(Boolean)
}

function toBoolean(annotation) {
  let line = annotation.line

  if (annotation.contents.length > 0) {
    return undefined
  }

  if (line === 'false') {
    return false
  } else if (line.length === 0 || line === 'true') {
    return true
  }

  return undefined
}

function markdown(...args) {
  return to.markdown([ ...args ].filter(Boolean).join('\n'))
}

function logAnnotationError(obj, expected) {
  expected = to.array(expected)
  const {
    annotation,
    comment,
    code,
    file
  } = obj

  const total_lines = ~~((11 + (annotation.end - annotation.start)) / 2)

  let indent = '  '
  indent += '  '

  const getSpaces = (number) => (number + '').split('').filter(Boolean).map(() => ' ').slice(1).join('')

  comment.contents = comment.contents.split('\n')
  code.contents = code.contents.split('\n')

  // used to modifiy the indention of numbers so that they align to the right
  let modifier = getSpaces(file.end)
  let temp_contents = to.flatten([ comment.contents, code.contents ])
  let comment_style = file.comment[comment.type].line
  // The line below should get the correct length but it currently doesn't
  // let total_comment_lines = comment.end - comment.start
  let total_comment_lines = comment.contents.length - 1
  let contents = []
  let expected_contents = []


  // @todo the code block doesn't return the correct number in some cases
  code.end = code.end > -1 ? code.end : file.end

  for (let i = comment.start; i < code.end; i++) {
    let index = i - comment.start
    let line = temp_contents[index]
    let line_number = i + 1
    let is_in_comment = is.between(index, 0, total_comment_lines)
    // let

    if (getSpaces(line_number) === modifier) {
      modifier = modifier.slice(1)
    }

    if (is.between(index, annotation.start, annotation.end)) {
      let expected_line = expected[index - annotation.start]

      if (expected_line) {
        contents.push(
          `${indent.slice(2)}${clor.red('-')} ${modifier}${clor.red(line_number)} | ${comment_style} ${clor.bgRed(line)}`
        )
        expected_contents.push(
          `${indent.slice(2)}${clor.green('+')} ${modifier}${clor.green(line_number)} | ${comment_style} ${clor.bgGreen(expected_line)}`
        )
      }

      if (
        expected_contents !== undefined && (
          !expected_line ||
          index === annotation.end
        )
      ) {
        contents.push(...expected_contents)
        expected_contents = undefined
      }

      if (!expected_line) {
        contents.push(
          `${indent}${modifier}${line_number} | ${comment_style} ${line}`
        )
      }
    } else {
      if (is_in_comment) {
        line = `${comment_style} ${line}`
      }
      contents.push(`${indent}${modifier}${line_number} | ${line}`)
    }
  }

  // trim the contents so there's not to much showing
  contents = contents.slice(
    to.clamp(annotation.start - total_lines, 0, contents.length),
    to.clamp(annotation.end + total_lines, 0, contents.length)
  )


  contents.unshift(...[
    '',
    `${indent}${clor.bold(file.path)}`, // adds the file path of the error
    `${indent}${clor.green('+ expected')} ${clor.red('- actual')}`, // adds a legend
    ''
  ])
  contents.push(...[ '', '' ])

  return contents.join('\n')
}


////
/// @name Annotations
/// @page annotations
/// @description
/// These are the default annotations for the docs
/// @type {object}
////
let annotations = {}


export default

/// @name @access
/// @arg {string} line [public] - public, private, protected
/// @description
/// Access of the documented item. If access isn't declared then it defaults to public.
/// @markup Usage
/// /// @access public
///
/// /// @access private
///
/// /// @access protected
/// @note This is autofilled on every header or body comment
annotations.access = {
  autofill() {
    return 'public'
  },
  parse() {
    const line = this.annotation.line
    if (
      line === 'private' ||
      line === 'protected'
    ) {
      return line
    }

    return 'public'
  }
}

/// @name @alias
/// @arg {string, list} line - The aliases to that are avaliable for this documented item
/// @description Whether the documented item is an alias of another item
/// @returns {array}
/// @markup Usage
/// /// @alias foo
///
/// /// @alias foo, bar
///
/// /// @alias foo
/// /// @alias bar
annotations.alias = {
  parse() {
    let alias_list = list(this.annotation.line)
    if (is.empty(alias_list)) {
      this.log.emit('warning', "You didn't pass in an alias to @alias on", logAnnotationError(this, '@alias name[, name]'))
    }

    return alias_list
  }
}


annotations.blockinfo = {
  autofill() {
    let comment = this.comment
    let code = this.code
    let file = this.file
    delete comment.contents
    delete code.contents
    delete file.contents
    delete file.name
    delete file.type
    delete file.comment

    return { comment, code, file }
  }
}

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
annotations.arg = {
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
annotations.author = {
  alias: [ 'authors' ],
  parse() {
    return multiple(this.annotation)
  }
}

/// @name @chainable
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
annotations.chainable = {
  alias: [ 'chain' ],
  parse() {
    let bool = toBoolean(this.annotation)

    if (bool !== undefined) {
      return bool
    }

    return multiple(this.annotation)
  }
}

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
annotations.deprecated = {
  parse() {
    let [ version = '0', description ] = regex('deprecated', this.annotation.line)
    return {
      version,
      description: markdown(description, this.annotation.contents)
    }
  }
}

/// @name @description
/// @alias @desc, @definition, @explanation, @writeup, @summary, @summarization
/// @description Description of the documented item
/// @note Runs through markdown
/// @returns {string}
/// @markup Usage
/// /// @description description
///
/// /// @description
/// /// # Long description.
/// /// Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed
/// /// do eiusmod tempor incididunt ut labore et dolore magna aliqua.
annotations.description = {
  alias: [
    'desc', 'definition', 'explanation',
    'writeup', 'summary', 'summarization'
  ],
  parse() {
    return markdown(this.annotation.line, this.annotation.contents)
  }
}


/// @name @markdown
/// @filetypes @markdown, @mark, @mdown, @mkdn, @mdtxt, @mkd, @mdml, @mdwn, @mdtext, @text, @md
/// @description
/// This markdown annotation is used to add a markdown files contents to the documentation.
/// It's typically only used in a header comment along with `@page`.
///
/// @note
/// On a side note, I have absolutly no idea why markdown has to many different file types
/// but I think I got all of them but If I missed open an issue or submit a pull request
///
/// @returns {string} The parsed markdown file
///
/// @markup Usage
/// <!----
/// @markdown
/// /--->
annotations.markdown = {
  filetypes: [
    'markdown', 'mark', 'mdown',
    'mkdn', 'mdtxt', 'mkd',
    'mdml', 'mdwn', 'mdtext',
    'text', 'md'
  ],
  parse() {
    const comment = this.file.comment
    const start = `(?:${comment.header.start}|${comment.body.start})`.replace('\\', '\\\\')
    const end = `(?:${comment.header.end}|${comment.body.end})`.replace('\\', '\\\\')
    const md_regex = new RegExp(`${start}(?:.|\\n)*\\n${end}`, 'gmi')

    return to.markdown(this.file.contents.replace(md_regex, ''))
  }
}

/// @name @markup
/// @alias @code, @example, @output, @outputs
/// @description
/// Example code on how to use the documented block.
///
///  - `id` is a way for a `@state` annotation to specify which `@markup` annotation it's state(s) should be applied to.
///  - `language` The language you're documenting. It defaults to the current file extention
///  - `settings` Settings that are passed to the code block
///  - `description` A short description of the documented item that is parsed in markdown
///
/// @note Description is parsed as markdown
/// @returns {object}
/// ```js
/// {
///   id: 'string', // id of the markup block, it defaults to '0'
///   language: 'string', // language of the block, defaults to
///   settings: {}, // settings for the code block
///   description: 'string',
///   raw: 'string', // raw string of code
///   escaped: 'string' // escaped code, aka `<span>` turns to `&lt;span&gt;`
/// }
/// ```
/// @markup Usage
/// /// @markup
/// /// code
///
/// /// @markup (id)
/// /// code
///
/// /// @markup {language}
/// /// code
///
/// /// @markup [settings]
/// /// code
///
/// /// @markup description
/// /// code
///
/// /// @markup (id) {language} [settings] - description
/// /// code
///
/// /// @markup (id) {language} [settings] description
/// /// code
annotations.markup = {
  alias: [ 'code', 'example', 'output', 'outputs' ],
  parse() {
    let escaped_characters = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#39;'
    }

    let [
      id = '0',
      language = this.file.type,
      settings = {},
      description
    ] = regex('markup', this.annotation.line)

    let raw = this.annotation.contents

    let escaped = raw
      .split('\n')
      .map((line) => line
        .replace(/[&<>'"]/g, (match) =>
          escaped_characters[match]
        )
      )
      .join('\n')

    if (is.string(settings)) {
      settings = to.object(list(settings).map((setting) => setting.split('=')))
    }

    return [
      {
        id,
        language,
        settings,
        description: markdown(description),
        raw,
        escaped
      }
    ]
  }
}

annotations['raw-code'] = {
  parse() {
    return this.code.contents
  }
}

/// @name @name
/// @alias @title, @heading, @header
/// @description Name of the documented item
/// @returns {string}
///
/// @markup Usage
/// /// @name Name of the documented item
annotations.name = {
  alias: [ 'title', 'heading', 'header' ]
}

/// @name @note
/// @alias @notes
/// @description A note about the documented item
/// @returns {object}
///
/// @markup Usage
/// /// @note description
///
/// /// @note {importance} description
///
/// /// @note {importance}
/// /// multi
/// /// line
/// /// description
annotations.note = {
  alias: [ 'notes' ],
  parse() {
    let [ importance = '0', description ] = regex('note', this.annotation.line)

    return [
      {
        importance,
        description: markdown(description, this.annotation.contents)
      }
    ]
  }
}

/// @name @page
/// @alias @group
/// @description The page you want the documented item to be on
/// @note {5}
/// If a header comment exists in a file without a `@page` annotation
/// it will be auto filled to other.
///
/// @note {10}
/// The `@page` attribute is one of the most important annotations because
/// it is what determines where your documentation for each file or block will go
/// in the documentation site. If you fail to have a header comment, and don't add
/// a `@page` annotation to your body comment then that documentation block will
/// be ignored if `options.raw` is `false`
///
/// @notes {10}
/// #### Usage
///  - If you specify a `@page` annotation in the header comment, all the body blocks on the page
/// will also be added to that page.
///  - If you want all the documentation for a specific file to be in multiple locations you can add
///    multiple pages to the header comment
///  - If you want a specific body comment block to go to a page you can just add a `@page` annotation,
///    and it will get added to the page specified in the header comment and the page that's specified
///    in the body comment block
///
/// @returns {array}
///
/// @markup Usage
/// ////
/// /// @page path
/// ////
///
/// /// @page path
///
/// /// @page add-block/to/location 1
/// /// @page also/add-block/to/location 2
///
/// /// @page add-block/to/location 1, also/add-block/to/location 2
annotations.page = {
  alias: [ 'group' ],
  parse() {
    return list(this.annotation.line)
  },
  autofill() {
    // autofill header comments
    if (this.comment.type === 'header') {
      return 'other'
    }
    // don't autofill body comments
    return
  }
}

/// @name @readonly
/// @description
/// To note that a property is readonly.
/// @returns {boolean}
///
/// @note {5} If `@readonly` is present without any arguments it will return `true`
///
/// @markup Usage
/// /// @readonly
///
/// /// @readonly true
///
/// /// @readonly false
annotations.readonly = {
  parse() {
    let bool = toBoolean(this.annotation)

    if (bool !== undefined) {
      return bool
    }

    return true
  }
}

/// @name @requires
/// @alias @require
/// @description Requirements from the documented item
/// @returns {object}
///
/// @markup Usage
/// /// @requires {type[, type]}
///
/// /// @requires name
///
/// /// @requires description
///
/// /// @requires {type[, type]} name - description
///
/// /// @requires {type[, type]} name description
annotations.requires = {
  alias: [ 'require' ],
  parse() {
    let [ types, name = '', description ] = regex('requires', this.annotation.line)

    return [
      {
        types: list(types),
        name,
        description: markdown(description, this.annotation.contents)
      }
    ]
  }
}

/// @name @returns
/// @alias @return
/// @description Return from the documented function
/// @returns {string}
/// @markup Usage
/// /// @returns
///
/// /// @returns {type[, type]}
///
/// /// @returns {type[, type]} - description
///
/// /// @returns {type[, type]} description
///
/// /// @returns {type[, type]}
/// /// multi
/// /// line
/// /// description
annotations.returns = {
  alias: [ 'return' ],
  parse() {
    let [ types, description ] = regex('returns', this.annotation.line)

    if (
      types == null ||
      types === ''
    ) {
      types = 'undefined'
    }

    return {
      types: list(types),
      description: markdown(description, this.annotation.contents)
    }
  }
}

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
annotations.since = {
  parse() {
    let [ version = 'undefined', description ] = regex('since', this.annotation.line)

    return {
      version,
      description: markdown(description, this.annotation.contents)
    }
  }
}

/// @name @state
/// @page annotations
/// @description A state of a the documented item
/// @returns {hashmap}
/// @markup Usage
/// /// @states (id) {state} [state_id] - description
///
/// /// @states (id) {state} [state_id] - description
/// /// @states (id) {state} [state_id] - description
/// /// @states (id) {state} [state_id] - description
///
/// /// @states (id)
/// /// {state} [state_id] - description
/// /// {state} [state_id] - description
/// /// {state} [state_id] - description
annotations.state = {
  parse() {
    let states = this.annotation.contents.split('\n')
    let [ markup_id = '0', state_line ] = regex('state_id', this.annotation.line)
    states.unshift(state_line)

    states = states.filter(Boolean).map((line, i) => {
      let [ state = '', state_id = `${i}`, description = '' ] = regex('state', line)

      return {
        state,
        state_id,
        description: markdown(description)
      }
    })

    return [
      { markup_id, states }
    ]
  },
  // resolve() {
  //   /// @todo {10} - add code to that adds the markup code for this stuff.
  // }
}

/// @name @throws
/// @alias @throw, @exception, @error, @catch
/// @description
/// The error that happends if something goes wrong
/// @returns {hashmap}
/// @markup Usage
/// /// @throws {type}
///
/// /// @throws description
///
/// /// @throws {type} - description
///
/// /// @throws {type} description
///
/// /// @throws
/// /// multi
/// /// line
/// /// description
annotations.throws = {
  alias: [ 'throw', 'exception', 'error', 'catch' ],
  parse() {
    let [ types, description ] = regex('throws', this.annotation.line)

    return [
      {
        types: list(types),
        description: markdown(description, this.annotation.contents)
      }
    ]
  }
}

/// @name @todo
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
annotations.todo = {
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
annotations.type = {
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
annotations.version = {
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

export default { ...annotations }
