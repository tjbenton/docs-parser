/* eslint-disable complexity, max-statements, max-depth */
import { is, to, debug as _debug } from '../utils'
import { default_options } from '../config'
import clor from 'clor'

/* eslint-enable */
@_debug('Tokenizer')
export default class Tokenizer {
  constructor(str, options = {}) { // eslint-disable-line
    options = to.arguments({
      content: '',
      comment: { start: '', line: '///', end: '' }, // the default comment style to look for
      blank_lines: default_options.blank_lines,
      verbose: false, // determins if all the extra line info will be returned or if it will just return strings
      strip: false, // determins if the comment should be stripped from the line
      restrict: false,
      indent: true,
    }, arguments)

    // Update the content
    {
      const { str: _str, string, source, code, content, contents, ...rest } = options
      str = _str || string || source || code || content || contents
      this.options = rest
    }


    // ensures that the comment style that was passed will work
    {
      let { start, line, single, end } = this.options.comment

      single = single || line
      // this ensures there aren't any errors while looking comment lines
      // because `''` will always have an index of `0`
      if (single === '') {
        single = undefined
      }

      if (is.any.in([ single, '' ], start, end)) {
        start = end = undefined
      }

      if (!single && is.any.undefined(start, end)) {
        throw new Error("You must set the start and end comment style if you don't specify a single comment")
      } else if (!start && !end && !single) {
        throw new Error('You must set the single comment or the start and end comment')
      } else if (is.all.existy(single, start, end) && (start.length <= single.length || start.end <= single.length)) {
        throw new Error('The start and end comments must be longer than the single comment')
      }

      this.options.comment = { start, single, end }

      this.is_multi = is.all.truthy(start, end)
      this.is_same_multi = this.is_multi && start === end
    }

    // holds the parsed tokens
    this.tokens = []

    const debug = this.debugSet('options')

    debug.push('this.options', this.options, '')

    if (!!str) {
      debug.push('has content in the options').run()
      this.parse(str)
      return this.tokens
    }
    debug.run()
    return
  }

  /// @name hasNext
  /// @description
  /// Used to check if the next line exists
  /// @returns {boolean}
  hasNext() {
    return this.debugHasNext.ifFalse(this.peak(), "doesn't have another element", true)
  }

  /// @name next
  /// @description
  /// Used to progress forward to the next line
  /// @returns {boolean} - If true it means the next line exists, else the next line doesn't exisit
  next() {
    const obj = this.iterator.next().value
    if (!obj) return false
    this.line = obj[1]
    this.lineno = obj[0]
    return true
  }

  /// @name peak
  /// @description
  /// This function is used to peak ahead or behind the current line
  /// @arg {number} amount [1] - The amount to look ahead or before
  /// @returns {object} - The line
  peak(amount = 1) {
    return this.stash[this.lineno + amount]
  }

  /// @name stash
  /// @description
  /// This updates the stash that's used for this parser
  /// @arg {string} str [''] - The string to use for the stash
  /// @returns {array} - The array of lines with the correct info
  getStash(content = '') {
    // add a starting line to the content to convert it to be 1 based instead of 0 based
    // fixes stupid ass issues with windows
    content = '\n' + to.normalString(content)

    // if the content is empty return an empty string
    if (this.isEmpty(content)) return []

    // add a space to each line so the line index is 1 based instead of 0 based. If the line is empty,
    // a space will not be added so that it's still easy to check if a line is empty or not. Doing this makes it
    // much easier to determine if any of the indexes are actually falsy or not, and it makes tracking errors easier
    let stash = to.map(to.array(content), (line, i) => {
      line = new Line(!line ? line : ` ${line}`, i)
      const str = `${line}`
      line.index = to.reduce([ 'start', 'single', 'end' ], (prev, next) => {
        prev[next] = this.commentExists(str, this.options.comment[next])
        return prev
      }, {})

      // This ensures that `line` can't be true if there's already a `start` or `end` style comment
      if (this.is_multi && (line.index.start || line.index.end)) {
        line.index.single = false
      }


      {
        const { start, single, end } = this.options.comment
        let code_exsists
        // remove the comment and check to see if it has a line has code on it.
        if (!this.is_multi && line.index.single) {
          code_exsists = !this.isEmpty(this.getBefore(single, str))
        } else if (this.is_same_multi || line.index.start) {
          code_exsists = !this.isEmpty(this.getBefore(start || end, str))
        } else {
          code_exsists = !this.isEmpty(this.getAfter(end, str))
        }

        line.index.code = code_exsists && line.indent
      }

      line.has_comment = is.any.truthy(line.index.start, line.index.single, line.index.end)
      line.has_code = is.truthy(line.index.code)

      return line
    })

    return stash
  }


  /// @name parse
  /// @description
  /// This will parse the passed content
  /// @arg {string} content [''] - The content to parse
  /// @arg {number} start_at [0] - The starting line to start parsing at
  /// @arg {boolean} verbose [this.verbose] - The default is what was passed when creating the Tokenizer
  /// @returns {array} - Of parsed tokens
  /// @note {5} This function also accepts a object to be passed with named arguments
  /// @markup Usage
  parse(content = '', start_at = 0, verbose) { // eslint-disable-line
    let options = to.arguments({
      content: '',
      start_at: this.options.start_at || 0,
      verbose: this.options.verbose,
    }, arguments)

    // update the verbose option incase it changed
    this.verbose = options.verbose

    // update the stash to use the passed content
    this.stash = options.content = this.getStash(options.content)

    // holds the current position in the stash to start from
    this.lineno = options.i || options.index || options.lineno || options.start_at || 0

    // update the iterator to use
    this.iterator = to.entries(this.stash, this.lineno)

    // holds the parsed tokens
    this.tokens = []

    this.setDebug()
    const debug = this.debugParse
    const result = this.getTokens()
    debug.push('parsed:', result)
    debug.run()

    return result
  }

  /// @name isEmpty
  /// @description checks to see if the passed string is empty(only contains spaces)
  /// @returns {boolean}
  isEmpty(str) {
    return !str.replace(/\s+/gm, '')
  }

  /// @name getTokens
  /// @description
  /// This function will recursively get all the tokens in the file
  getTokens() {
    this.token = undefined
    this.setDebug(true)
    const debug = this.debugGetTokens
    if (!this.hasNext()) {
      return this.tokens
    }

    this.next()

    if (
      debug.ifTrue(is.empty(`${this.line}`.trim()), "the line was empty, and isn't in a token already") ||
      debug.ifTrue(!this.line.has_comment, "The line doesn't have a comment, and isn't in a token already")
    ) {
      debug.push('', '', '', '').run()
      return this.getTokens()
    }

    debug.push(`line [${this.lineno}]: ${clor.bgBlue(this.line)}`, this.line).run()

    if (this.line.has_comment) {
      this.token = new Token()
      debug.push('has comment').run()

      if (this.is_same_multi && this.line.index.start === this.line.index.end) {
        this.line.index.end = false
      }

      if (!this.is_multi) {
        this.getSingleComment()
      } else {
        this.getMultiComment()
      }
    }

    if (this.line.has_code) {
      this.getCode()
    }

    if (is.truthy(this.token)) {
      this.pushToken()
    }

    debug.push('', '', '', '').run()
    if (!this.options.restrict) {
      return this.getTokens()
    }
  }

  /// @name this.getBefore
  /// @description
  /// This function is used to get the content before a comment
  /// @arg {string} comment - the comment to start after
  /// @arg {string} str - the content to extract the content from
  /// @returns {string}
  getBefore(comment, str) {
    if (!comment || !str) return str
    return str.split(comment).shift()
  }

  /// @name this.getAfter
  /// @description
  /// This function is used to get the content after a comment
  /// @arg {string} comment - the comment to start after
  /// @arg {string} str - the content to extract the content from
  /// @returns {string}
  getAfter(comment, str) {
    if (!comment || !str) return str
    return str.split(comment).pop()
  }

  /// @name getCode
  /// @description
  /// Recursively pushes the code from each line onto the current token
  getCode() {
    const debug = this.debugGetCode
    const { indent } = this.line

    const recursiveCode = () => {
      let line = to.clone(this.line)
      if (
        !this.is_same_multi &&
        !line.index.start &&
        line.index.end
      ) {
        line.line = `${line}`.slice(line.index.end + this.options.comment.end.length + 1)
      } else {
        line.line = `${line}`.slice(1, line.index.start || line.index.single || line.index.end || undefined)
      }


      // check to see if the current lines indent is less than the starting indent of the code
      if (this.options.indent && !is.empty(line.toString()) && line.indent < indent) {
        return
      }

      // push the line onto the code contents
      this.token.code.contents.push(line)

      if (
        this.hasNext() &&
        debug.ifTrue(!this.is_same_multi || !line.has_comment, `the current line(${line.lineno}) doesn't have a comment: ${clor.bgGreen(line)}`)
      ) {
        const next_line = this.peak()
        const next_msg = `the next line(${next_line.lineno}) has a comment: ${clor.bgRed(next_line)}`
        return debug.ifFalse(!next_line.has_comment, next_msg) && this.next() && recursiveCode()
      }
    }

    recursiveCode()
    debug.run()
  }

  /// @name getSingleComment
  /// @description
  /// Recursively pushes the single comment lines from each line onto the
  /// current token until the next instance of code
  getSingleComment() {
    const debug = this.debugGetSingleComment
    const { comment } = this.options
    let line = to.clone(this.line)
    line.line = this.getAfter(comment.single, `${line}`)

    this.token.comment.contents.push(line)
    const current_msg = `the current line(${line.lineno}) doesn't have code: ${clor.bgGreen(line)}`
    if (debug.ifTrue(!line.has_code, current_msg) && this.hasNext()) {
      const next_line = this.peak()
      const context = next_line.has_code ? 'has code' : 'is empty'
      const next_msg = `the next line(${next_line.lineno}) ${context}: ${clor.bgRed(next_line)}`

      this.next()
      return debug.ifFalse(next_line.has_comment && !next_line.has_code, next_msg, true) && this.getSingleComment()
    }
    debug.run()
  }

  /// @name getMultiComment
  /// @description
  /// Recursively pushes the multi line comment lines onto the
  /// current token until the next instance of code
  getMultiComment() {
    const debug = this.debugGetMultiComment
    const { comment } = this.options

    let line = to.clone(this.line)
    let str = `${line}`

    if (line.index.start || line.index.single) {
      str = this.getAfter(line.index.start ? comment.start : comment.single, str)
    }

    if (line.index.end) {
      str = this[this.is_same_multi ? 'getAfter' : 'getBefore'](comment.end, str)

      // update the start index if the indexes are the same
      if (this.is_same_multi && line.index.start === line.index.end) {
        line.index.start = false
      }
    }

    line.line = str
    this.token.comment.contents.push(line)
    debug.push(line)
    if (this.hasNext()) {
      if (debug.ifTrue(!line.index.end, `the current line(${line.lineno}) wasn't the last comment: ${clor.bgGreen(this.line)}`)) {
        debug.run()
        return this.next() && this.getMultiComment()
      }
      const next = this.peak()
      if (
        debug.ifTrue(!line.index.code, `the current line(${line.lineno}) doesn't has code: ${clor.bgGreen(line)}`) &&
        debug.ifTrue(!next.has_comment, `the next line(${next.lineno}) doesn't have a comment: ${clor.bgGreen(next)}`)
      ) {
        debug.run()
        return this.next()
      }
    }

    debug.run()
    return
  }

  /// @name pushToken
  /// @description
  /// This function is used to push the current token onto the parsed token list(`this.tokens`).
  /// It will normalize all the content that's passed to the comment and code in the token, then
  /// determin the starting and ending point for the comment and code.
  pushToken() {
    const debug = this.debugPushToken
    let token = to.clone(this.token)

    const normalizeContent = (obj, set_start_end_before = false) => {
      // normalize the contents of the obj
      let { content, leading, trailing } = to.normalize(obj.contents.join('\n'), { info: true })
      let lines = to.array(content)
      trailing += obj.contents.length
      const points = () => {
        obj.start = (obj.contents[0] || {}).lineno || -1 // get the starting line of the comment
        obj.end = (obj.contents.slice(-1)[0] || {}).lineno || -1 // get the end line of the comment
      }

      if (set_start_end_before) points()

      obj.contents = obj.contents
        .filter((line, i) => i >= leading && i < trailing) // filter out the lines that were removed
        .map((line, i) => {
          line.line = lines[i] // update the lines content to be the normalized version
          return line
        })

      if (!set_start_end_before) points()

      if (this.isEmpty(content)) {
        obj = new Token().code
        return obj
      }


      // obj.raw_contents = content.split('\n')
      // @todo uncomment these lines after everything setup and working
      if (!this.options.verbose) {
        // obj.raw_contents = obj.contents
        obj.contents = content.split('\n')
      }

      return obj
    }

    token.comment = normalizeContent(token.comment, true)
    token.code = normalizeContent(token.code)
    debug.push(token).run()
    this.tokens.push(token)
    this.token = undefined
  }

  /// @name commentExisits
  /// @description
  /// this is a helper function that is used to test the existence of the comment on a given line
  commentExists(line, comment_type) {
    // ensure that the line, and comment_type are truthy
    if (is.any.falsy(line, comment_type)) {
      return false
    }

    // store the index of the comment_type
    let index = line.indexOf(comment_type)

    // check to see if the comment_type exisits
    if (index > -1) {
      if (
        is.in(line, `${comment_type} `) || // check to see if the required space after the comment_type exisits
        line.length === index + comment_type.length || // check to see if the comment_type is the last thing on that line (aka <!--- --->)
        !line.slice(0, index).trim()
      ) {
        return index
      }
    }

    return false
  }

  /// @name setDebug
  /// @description
  /// This function is used to turn the debug options on or off
  /// @arg {boolean} condition
  setDebug(condition) {
    if (is.undefined(condition)) {
      condition = this.should_debug || false
    }

    this.debugParse = this.debugSet('parse', { condition, spaces: 0 })
    this.debugGetTokens = this.debugSet('parse', { condition, spaces: 0 })
    this.debugGetSingleComment = this.debugGetTokens.set('getSingleComment', 0)
    this.debugGetMultiComment = this.debugGetTokens.set('getMultiComment', 0)
    this.debugGetCode = this.debugGetTokens.set('getCode', 0)
    this.debugPushToken = this.debugGetTokens.set('pushToken', 0)
    this.debugHasNext = this.debugGetTokens.set('hasNext', 0)
  }
}


class Token {
  constructor() {
    // The base of what each token looks like
    this.token_base = {
      comment: { contents: [], start: -1, end: -1 },
      code: { contents: [], start: -1, end: -1 }
    }

    return to.clone(this.token_base)
  }
}


class Line {
  constructor(...args) {
    args = to.arguments({
      line: '',
      lineno: ''
    }, ...args)
    to.extend(this, args)
    this.raw = this.line
    this.indent = to.indentLevel(this.line)
  }

  get length() {
    return this.line.length
  }

  toString() {
    return this.line
  }

  get str() {
    return this.line
  }

  get string() {
    return this.line
  }
}
