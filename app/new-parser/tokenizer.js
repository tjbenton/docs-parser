/* eslint-disable complexity, max-statements, max-depth */
import { is, to, debug as _debug } from '../utils'
import { default_options } from '../config'
import clor from 'clor'


/// @name tokenizer
/// @access private
/// @description Parses the file and returns the comment blocks in an array
/// @returns {array} of the comment blocks
/// @todo {5} - add a line offest argument to this so that you can call parse content on other language types.
export default function tokenizer(settings) {
  // filters out the settings that aren't needed to prevent cluter
  settings = to.filter(settings, ({ key }) => is.in([ 'file', 'blank_lines', 'sort', 'log', 'language' ], key))

  let {
    file,
    language,
    sort, // @todo figure out if this is needed
    ...options
  } = settings

  // let header = new Tokenizer({ comment: settings.file.settings.header, ...settings, restrict: true })
  let body = new Tokenizer( // eslint-disable-line
    settings.file.contents,
    {
      comment: settings.file.settings.body,
      should_debug: true,
      ...options,
    }
    // settings.file.settings.body,
    // { ...settings, should_debug: true }
  )
  // console.log('new parser:', to.json(header))
  // console.log('new parser:', to.json(body))
  return ''
}

@_debug('Tokenizer')
export class Tokenizer {
  constructor(content, options = {}) {
    if (arguments.length === 1 && is.plainObject(content)) {
      options = arguments[0]
      content = options.str || options.content || options.source
    }

    // forces the string to become 1 based instead of 0 and it normalizes it #windows sucks
    content = '\n' + to.normalString(content)

    options = to.extend({
      comment: { start: '', line: '///', end: '' }, // the default comment style to look for
      blank_lines: default_options.blank_lines,
      strip: false, // determins if the comment should be stripped from the line
      retrict: false,
    }, options)

    to.extend(this, options)

    this.lines = to.array(content)
    this.lineno = to.number(this.start_at || this.lineno, this.i || this.index || 0)
    this.is_multi = is.all.truthy(this.comment.start, this.comment.end)

    // this ensures there aren't any errors looking comment lines
    // because `''` will always have an index of `0`
    if (this.comment.line === '') {
      this.comment.line = undefined
    }

    // The base of what each token looks like
    this.token_base = {
      comment: { contents: [], start: -1, end: -1 },
      code: { contents: [], start: -1, end: -1 }
    }
    // add the comment type if it was passed
    if (this.comment.type) {
      this.token_base.comment.type = this.comment.type
    }

    this.tokens = [] // placeholder for all the parsed tokens
    this.blank_line_count = 0 // stores the current count of blank lines
    this.token = undefined // stores the current token
    this.in_comment = false // used to determin that you are in a comment
    this.in_code = false // used to determin if you are in the code after the comment block

    // checks to see if the file has any comments
    if (
      this.is_multi &&
      !is.any.in(content, this.comment.start, this.comment.end) || // checks if the multi line comment style exists
      !is.in(content, this.comment.line) // checks if the single line comment style exists
    ) {
      return []
    }

    // debuggers
    this.debugLine = this.debugSet('line', { spaces: 2 })
    this.debugUpdate = this.debugLine.debugSet('update', 0)
    this.debugWalkComment = this.debugLine.debugSet('walkComment', 0)
    this.debugIsCode = this.debugLine.set('isCode', { spaces: 0, color: 'green' })
    this.debugIsComment = this.debugLine.set('isComment', 0)
    this.debugIsLastLine = this.debugLine.set('isLasLine', { spaces: 0, color: 'bgRed' })
    this.debugShouldStop = this.debugLine.set('shouldStop', 0)
    this.debugPushToken = this.debugLine.debugSet('pushToken', 0)

    this.tokenize()
    return this.tokens
  }

  tokenize() {
    this.lineno--
    while (this.update('updated from the loop')) {
      // if `this.break` is set at any point it will stop loop
      // and return the tokens that exist
      if (this.break) {
        break
        this.pushToken()
        return this.tokens
      }
      this.visit()
      this.debugLine.run()
    }
  }

  ifToken() {
    return !this.break && !is.undefined(this.token)
  }

  pushToken(pushed_from = 'unknown unknown') {
    const debug = this.debugPushToken
    debug.push(`pushed from: ${pushed_from}`)
    debug.run()

    // set the end point of the code or the comment
    this.token[this.token.comment.end > -1 && this.token.code.start > -1 ? 'code' : 'comment'].end = this.lineno

    // normalize the comment contents by striping out empty lines from the start and end of comment block
    this.token.comment.contents = to.normalize(this.token.comment.contents).split('\n')

    let code = this.token.code
    // normalize the code contents
    code.contents = to.normalize(code.contents).split('\n')
    // check to see if the code contents is just empty lines
    if (is.empty(code.contents.filter((line) => !!line.trim()))) {
      // set code start and end points to -1 because there really wasn't any code
      code.start = -1
      code.end = -1
      code.contents = []
    }

    this.token.code = code
    
    // push the finished token to the tokens list
    this.tokens.push(this.token)
    
    // reset the token to be undefined because it's finished
    this.token = undefined
  }

  update(updated_from = 'wtf yo') {
    const debug = this.debugUpdate
    debug.push(`updated from: ${updated_from}`)

    if (!(++this.lineno < this.lines.length)) {
      this.break = true
      if (this.ifToken()) {
        // lol I don't know why i put this here but it looks important
        console.log(`${clor.red.bold.underline('FUCK!!!FUCK!!!FUCK!!!FUCK!!!FUCK!!!FUCK!!!FUCK!!!FUCK!!!FUCK!!!FUCK')}`)
      }
      return false
    }

    this.line = this.lines[this.lineno]
    debug.push(`line ${this.lineno}: ${!this.line ? clor.bgRed('empty line') : clor.bgBlue(this.line)}`)

    // If you're trying to debug something between specific lines you
    // can use this to narrow down the longs to the lines you're wanting debug
    // just pass in the starting line number and end line number both should be 1
    // less that what you're looking for since this is zero based.
    // debug = is.between(i, [start line], [end line])
    // this.should_debug = is.between(this.lineno, 0, 8)

    // this is a helper function that is used
    // to test the existence of the comment
    const test_comment = (comment) => {
      if (is.falsy(comment)) {
        return false
      }
      // store the index of the comment
      let index = this.line.indexOf(comment)
      // check to see if the comment exisits
      if (index > -1) {
        // check to see if the required space after the comment exisits
        if (is.in(this.line, `${comment} `)) {
          return index
        }

        // check to see if the comment is the last thing on that line
        // aka <!--- --->
        if (this.line.length === index + comment.length) {
          return index
        }
      }

      return false
    }

    this.index = to.reduce([ 'start', 'line', 'end' ], (prev, next) => {
      prev[next] = test_comment(this.comment[next])
      return prev
    }, {})

    debug.push('index:', this.index)
    debug.run()
    return true
  }

  visit() {
    if (!is.empty(this.line)) {
      // reset the current blank line count back to 0 because this line wasn't empty
      this.blank_line_count = 0

      // // there's instance of comment
      if (this.isComment()) {
        this.walkComment()
        if (this.restrict) {
          this.debugLine.debug('is restricted')
          return this.tokens
        }
      }

      if (this.isCode()) {
      //   this.debug('is code')
      //   // Stops the loop after the first comment block
      //   // has been parsed. This is for file header comments
      //   if (this.restrict) {
      //     this.pushToken()
      //     break
      //   }
      //
        this.walkCode()
      }
    } else if (this.shouldStop()) {
      this.token[this.token.comment.end > -1 ? 'code' : 'comment'].end = this.lineno
      this.pushToken()
    }
  }

  isLastLine() {
    // checks to see if the current line is the last line in the file
    const length = this.is_multi && this.index.end !== false ? this.lines.length : this.lines.length - 1
    if (this.lineno === length) {
      this.debugIsLastLine.run()
      return true
    }
    return false
  }

  shouldStop() {
    const debug = this.debugShouldStop
    if (
      this.ifToken() && (
        // checks to see if there were 4 consecutive blank lines
        debug.debugIfTrue(++this.blank_line_count === this.blank_lines, 'hit the max blank lines') ||
        //  checks to see if it was the last line in the file
        this.isLastLine()
      )
    ) {
      debug.push('is stopping')
      debug.run()
      return true
    }

    return false
  }


  isComment() {
    const debug = this.debugIsComment
    // checks for the start and end style or there was an instance of a comment line
    if (
      this.is_multi && (
        debug.debugIfTrue(this.index.start !== false, 'is the start of a multi line comment') ||
        debug.debugIfTrue(this.in_comment, 'is in a multi line comment')
      ) ||
      debug.debugIfTrue(this.index.line !== false, 'is single line comment')
    ) {
      debug.run()
      return true
    }
    return false
  }

  walkComment() {
    const debug = this.debugWalkComment

    // Handles situations where there's a start and end style comment that are identical
    // such as { start: '////', line: '///', end: '////' }. If the comment styles
    // are identical they can't be used like this `//// some comment //// some other comment`
    // however `<!--- some comment --->` is perfectly acceptable
    if (
      this.is_multi &&
      this.comment.start === this.comment.end &&
      this.ifToken() &&
      this.token.comment.start !== -1
    ) {
      this.comment.start = false
    }

    // check for the start of a new token block
    const isNewToken = this.index.start !== false || (!this.is_multi && !this.in_comment)
    if (isNewToken) {
      debug.push('is new token')
      this.in_code = false
      this.in_comment = true

      // There was a token that has already been processed
      if (this.ifToken()) {
        this.token.code.end = this.lineno - 1 // sets the line number to be the previous line
        this.pushToken()

        // Stops the loop after the first comment token
        // has been parsed. This is for file header comments
        if (this.restrict) {
          this.tokens[0].comment.end = this.lineno
          this.tokens[0].code.end = -1
          return this.tokens
        }
      }

      // reset the `token` to use on the new token
      this.token = to.clone(this.token_base)
      this.token.comment.start = this.lineno

      this.in_comment = true
    }

    // check for the end comment
    const isEndComment = this.is_multi && this.token.comment.start !== this.lineno && this.index.end !== false
    if (this.ifToken() && isEndComment) {
      debug.push('is end comment')
      this.in_comment = false
      this.token.comment.end = this.lineno // sets the end line in the comment token

      // @todo try to use `this.update()` instead of the following lines
      this.lineno++ // skips end comment line
      this.line = this.lines[this.lineno] // updates to be the next line
      this.index.end = (this.line && is.in(this.line, this.comment.end)) ? this.line.indexOf(this.comment.end) : false
    }

    // adds this line to token comment contents
    const shouldPushLine = this.in_comment && (this.index.start === false || this.index.end === false)
    if (shouldPushLine) {
      if (this.index.line !== false) {
        // removes the `comment.line` from the line.
        this.line = this.line.slice(this.index.line + this.comment.line.length)
      } else if (this.index.start !== false) {
        // removes the `comment.start` from the line.
        this.line = this.line.slice(this.index.start + this.comment.start.length)
      }

      debug.push('line was pushed')
      this.token.comment.contents.push(this.line)
    }


    // The last line in the file is a commment
    if (this.in_comment && this.isLastLine()) {
      debug.push('the last line in the file is a comment')
      this.token.comment.end = this.is_multi ? this.lineno - 1 : this.lineno
      this.pushToken()
      this.break = true
    } else if (
      !this.is_multi &&
      !is.in(this.lines[this.lineno + 1], this.comment.line)
    ) {
      debug.push('next line is not a comment')
      this.in_comment = false
      this.token.comment.end = this.lineno // sets the end line in the comment token
      this.update('checks the next line') // updates to be the next line
    }

    debug.run()
  }

  isCode() {
    if (
      this.ifToken() &&
      !this.in_comment &&
      this.index.end === false
    ) {
      this.debugIsCode.run()
      this.in_comment = false
      this.in_code = true
      return true
    }
    return false
  }

  walkCode() {
    // The previous line was a comment
    if (this.token.code.start === -1) {
      this.token.code.start = this.lineno
    }

    // adds this line to token code contents
    this.token.code.contents.push(this.line)

    // pushes the last token onto the body
    if (this.isLastLine()) {
      this.token.code.end = this.lineno
      this.pushToken()
    }
  }
}
/* eslint-disable */




// class Line {
//   constructor(line, info = {}) {
//     this.str = line
//     to.extend(this, info)
//   }
//   get line() {
//     return this.str
//   }
// }
//
// Object.defineProperty(Line.prototype, 'toString', {
//   value() { return this.line }
// })


class Line {
  constructor(line, {
    lineno = 'NA',
    column = 'NA',
    type = undefined, // expect one of `'start'`, `'line'`, `'end'`, `'code'`
    index = undefined
  } = {}) {
    this.line = line

    to.extend(this, {
      lineno,
      column,
      type,
      index
    })

    return this.line
  }
}

Object.defineProperty(Line.prototype, 'toString', {
  value() { return this.line }
})



















/* eslint-enable */
@debug('Tokenizer')
class _Tokenizer { // eslint-disable-line
  constructor(settings) {
    to.extend(this, settings)

    this.i = to.number(this.start_at || this.i || this.index || 0)

    this.is_multi = is.all.truthy(this.comment.start, this.comment.end)

    // this ensures there aren't any errors looking comment lines
    // because `''` will always have an index of `0`
    if (this.comment.line === '') {
      this.comment.line = undefined
    }

    this.token_base = {
      comment: { contents: [], start: -1, end: -1, type: this.comment.type },
      code: { contents: [], start: -1, end: -1 },
      file: this.file
    }

    this.lines = to.array(this.file.contents) // lines of the file
    this.tokens = [] // placeholder for all the parsed tokens
    this.blank_line_count = 0 // stores the current count of blank lines
    this.token = undefined // stores the current block
    this.in_comment = false // used to determin that you are in a comment
    this.in_code = false // used to determin if you are in the code after the comment block

    this.debug_file = !is.undefined(this.debug_file) ? this.debug_file : false
    this.debug_list = []

    if (!(this.is_multi ? is.any.in(this.file.contents, this.comment.start, this.comment.end) : is.in(this.file.contents, this.comment.line))) {
      return []
    }

    return this.tokenize()
  }

  update() {
    this.line = this.lines[this.i]

    // If you're trying to debug something between specific lines you
    // can use this to narrow down the longs to the lines you're wanting debug
    // just pass in the starting line number and end line number both should be 1
    // less that what you're looking for since this is zero based.
    // debug = is.between(i, [start line], [end line])
    // this.debug_file = is.between(this.i, 0, 8)
    this.index = {
      start: this.is_multi && is.in(this.line, this.comment.start) ? this.line.indexOf(this.comment.start) : false,
      line: is.in(this.line, this.comment.line) ? this.line.indexOf(this.comment.line) : false,
      end: this.is_multi && is.in(this.line, this.comment.end) ? this.line.indexOf(this.comment.end) : false
    }
  }

  tokenize() {
    for (; this.i < this.lines.length; this.i++) {
      this.update()
      this.debug(`line ${this.i}:`)
      this.debug(this.line)
      this.debug('index:', this.index)

      if (!is.empty(this.line)) {
        // reset the current blank line count back to 0 because this line wasn't empty
        this.blank_line_count = 0

        // there's instance of comment
        if (this.isComment()) {
          this.debug('is a comment')
          this.walkComment()

          if (this.restrict) {
            this.debug('is restricted')
            return this.token
          }
        }

        if (this.isCode()) {
          this.debug('is code')
          // Stops the loop after the first comment block
          // has been parsed. This is for file header comments
          if (this.restrict) {
            this.pushToken()
            break
          }

          this.walkCode()
        }
      } else if (this.isStopWorthy()) {
        this.handleStopWorthy()
      }



      this.runDebug()
    }

    return this.tokens
  }


  isCode() {
    if (this.hasExistingToken() && !this.in_comment && this.index.end === false) {
      this.in_comment = false
      this.in_code = true
      return true
    }
    return false
  }


  isComment() {
    // checks for the start and end style or there was an instance of a comment line
    return this.is_multi && (this.index.start !== false || this.in_comment) || this.index.line !== false
  }

  isLastLine() {
    // checks to see if the current line is the last line in the file
    if (this.i === this.lines.length - 1 && is.truthy(this.token) && this.hasExistingToken()) {
      this.debug('is the last line')
      return true
    }
    return false
  }

  hasExistingToken() {
    return !is.undefined(this.token)
  }


  isStopWorthy() {
    return this.hasExistingToken() && (
      // checks to see if there were 4 consecutive blank lines
      ++this.blank_line_count === this.blank_lines ||
      this.isLastLine()
    )
  }

  handleStopWorthy() {
    this.token[this.token.comment.end > -1 ? 'code' : 'comment'].end = this.i
    this.pushToken()
    this.token = undefined
  }


  walkComment() {
    // check for the start of a new token block
    if (this.isNewToken()) {
      this.handleNewToken()
    }

    // check for the end comment
    if (this.isEndComment()) {
      this.handleEndComment()
    }

    // adds this line to token comment contents
    if (this.isWorthy()) {
      this.handleWorthy()
    }

    // The last line in the file is a commment
    if (this.isLastLineComment()) {
      this.handleLastLineComment()
    }

    // check the next line for an instance of the a line comment
    if (this.isNextLineComment()) {
      this.handleNextLineComment()
    }
  }


  isWorthy() {
    return this.hasExistingToken() && this.in_comment && (this.index.start === false || this.index.end === false)
  }

  handleWorthy() {
    this.debug('is worthy')
    if (this.index.line !== false) {
      // removes the `comment.line` from the line.
      this.line = this.line.slice(this.index.line + this.comment.line.length)
    } else if (this.index.start !== false) {
      // removes the `comment.start` from the line.
      this.line = this.line.slice(this.index.start + this.comment.start.length)
    }

    if (!is.empty(this.line)) {
      this.debug('line was pushed')
      this.token.comment.contents.push(this.line)
    }
  }


  isNewToken() {
    if (
      this.index.start !== false || (
        !this.is_multi &&
        !this.in_comment
      )
    ) {
      this.debug('is new token')
      this.in_code = false
      this.in_comment = true
      return true
    }
    return false
  }

  handleNewToken() {
    // There was a token that has already been processed
    if (this.hasExistingToken()) { // holds the current token information
      this.debug('this.token', this.token)
      this.token.code.end = this.i - 1
      this.pushToken()

      // Stops the loop after the first comment token
      // has been parsed. This is for file header comments
      if (this.restrict) {
        this.token.comment.end = this.i
        this.token.code.end = -1
        return this.tokens
      }
    }

    // reset the `token` to use on the new token
    this.token = to.clone(this.token_base)
    this.token.comment.start = this.i

    this.in_comment = true
  }


  isEndComment() {
    if (
      this.token &&
      this.is_multi &&
      this.token.comment.start !== this.i &&
      this.index.end !== false
    ) {
      this.debug('is end comment')
      return true
    }

    return false
  }

  handleEndComment() {
    this.debug('handled end comment')
    this.in_comment = false
    this.token.comment.end = this.i // sets the end line in the comment token
    this.i++ // skips end comment line
    this.line = this.lines[this.i] // updates to be the next line
    this.index.end = (this.line && is.in(this.line, this.comment.end)) ? this.line.indexOf(this.comment.end) : false
  }


  isLastLineComment() {
    let length = this.file.end

    if (!(this.is_multi && this.index.end !== false)) {
      length--
    }

    if (this.in_comment && (this.i === length)) {
      return true
    }

    return false
  }

  handleLastLineComment() {
    this.debug('the last line in the file is a comment')
    this.token.comment.end = this.is_multi ? this.i - 1 : this.i
    this.pushToken()
  }

  isNextLineComment() {
    return !this.is_multi && !is.in(this.lines[this.i + 1], this.comment.line)
  }

  handleNextLineComment() {
    this.debug('next line is a comment')
    this.in_comment = false
    this.token.comment.end = this.i // sets the end line in the comment token
    this.i = this.i + 1 // skips end comment line
    this.line = this.lines[this.i] // updates to be the next line
  }


  walkCode() {
    // The previous line was a comment
    if (!this.in_code) {
      this.in_code = true
      this.token.code.start = this.i
    }

    // adds this line to token code contents
    this.token.code.contents.push(this.line)

    // pushes the last token onto the body
    if (this.isLastLine()) {
      this.token.code.end = this.i
      this.pushToken()
    }
  }


  pushToken() {
    this.token.comment.contents = to.normalize(this.token.comment.contents)
    this.token.code.contents = to.normalize(this.token.code.contents)
    this.tokens.push(this.token)
  }



  // This is used for debuging files. to debug a file just set `this.debug_file = true` and this will debug files
  // @note THIS SHOULD NEVER BE COMMITTED AS `TRUE`
  debug(...args) {
    this.debug_list.push(...args)
    return this.debug_file
  }

  runDebug() {
    if (this.debug_file && this.debug_list.length > 0) {
      this.debug_list.slice(0, 1).forEach((obj) => {
        console.log('')
        this.log.debug(obj)
      })
      this.debug_list.slice(1).forEach((obj) => this.log.print(obj))
      this.debug_list = []
    }
  }
}
