import { fs, is, to, Logger } from '../utils'
import AnnotationApi from '../new-annotation-api'
import path from 'path'
// import getBlocks from '../../get-blocks'
// import parseBlocks from '../parser/parse-blocks'
// import getConfig from '../config'
import Tokenizer from './tokenizer'
// import clor from 'clor'

export default class Parser {
  constructor(options) { // eslint-disable-line
    this.setOptions(arguments)
  }

  setOptions(options) {
    options = to.arguments({
      language: {
        prefix: '@',

        // header comment style
        // @note {10} only 1 of these can be used per file
        header: { start: '////', line: '///', end: '////', type: 'header' },

        // body comment style
        body: { start: '', line: '///', end: '', type: 'body' },

        // inline comment style
        inline: { start: '', line: '///#', end: '', type: 'inline' },

        // this is used for any interpolations that might occur in annotations.
        // I don't see this needing to change but just incase I'm making it a setting.
        // @note {10} This setting is used to create a RegExp so certain characters need to be escaped
        interpolation: { start: '\\${', end: '}' },
      },
      type: undefined,
      blank_lines: 4,
      indent: true,
      annotations: {},
      sort: (a, b) => a.localeCompare(b), // same as the default sort function
      log: new Logger()
    }, arguments)

    let { annotations, type, ...rest } = options
    this.options = rest
    this.api = new AnnotationApi({ annotations, type })

    {
      let { alias, parse } = this.api.annotations
      parse = to.keys(parse)
      const reverse_alias_list = to.reduce(alias, (previous, { key, value }) => {
        value = value
          .filter((_alias) => !is.in(parse, _alias))
          .reduce((a, b) => to.extend(a, { [b]: key }), {})
        return to.extend(previous, value)
      }, {})
      const regex = new RegExp(`^\s*${this.options.language.prefix}(?:(${to.keys(reverse_alias_list).join('|')})|(${parse.join('|')}))\\b\\s*`)

      this.annotations_list = { reverse_alias_list, regex }
    }
  }

  async parse(file = {}) {
    file = is.plainObject(file) ? file : { path: file }
    file.type = file.type || path.extname(file.path).replace('.', '')
    file.contents = file.contents || to.string(await fs.readFile(file.path))
    file.name = path.basename(file.path, `.${file.type}`) // name of the file
    file.options = this.options.language
    file.start = 1 // starting point of the file
    file.end = to.array(file.contents).length - 1 // ending point of the file
    this.file = file

    let tokens = this.getTokens(file.contents)
    tokens = this.getAnnotations(tokens)
    tokens = this.parseTokens(tokens)
    tokens = this.autofillTokens(tokens)
    tokens = this.resolveTokens(tokens)
    // console.log('')
    // console.log('')
    // console.log('')
    // console.log('')
    console.log(to.json(tokens))
    return tokens
  }

  getTokens(contents = '') {
    const { language, blank_lines, indent } = this.options
    const base = { blank_lines, indent, verbose: true }
    const header = new Tokenizer(contents, 0, language.header, { restrict: true, ...base })[0] || {}
    let body = new Tokenizer(contents, header.comment ? header.comment.end : 0, language.body, base)
    const inline_tokenizer = new Tokenizer({ comment: language.inline, ...base })

    body = body.map((token) => {
      let { start: offset } = token.code
      offset -= 1
      token.inline = inline_tokenizer.parse(token.code.contents, { offset })
      return token
    })

    return { header, body }
  }

  map({ header, body }, callback) {
    const map = (token) => {
      if (is.empty(token)) return {}
      token = callback(token)

      if (token.inline && !is.empty(token.inline)) {
        token.inline = to.map(token.inline, map)
      }

      return token
    }

    header = map(header)
    body = to.map(body, map)
    return { header, body }
  }

  getAnnotations({ header, body }) {
    const { language } = this.options
    const { reverse_alias_list, regex } = this.annotations_list
    const hasAnnotation = (line) => {
      line.has_annotation = false // by default each line doesn't have a annotation
      // remove the annotation from the line
      line.str = `${line}`.replace(regex, (match, alias, annotation) => {
        if (alias) {
          // find the correct annotation to use if an alias is found
          annotation = reverse_alias_list[alias]
        }
        line.raw_without_comment = line.str // save the origial string with the annotation just in case it needs to be used later
        line.annotation = annotation || '' // if an annotation was found then set the name of the annotation
        line.raw_annotation = !!annotation ? `${language.prefix}${annotation}` : '' // set the raw annotation with the prefix
        line.alias = alias || '' // if an alias was used the save it
        line.has_annotation = true
        return ''
      })

      return line
    }

    return this.map({ header, body }, (token) => {
      let { comment, code, inline } = token

      // find lines that have annotations and set the correct annotation if an alias is found
      comment.contents = to.map(comment.contents, hasAnnotation)

      comment.contents = new Lines(comment.contents)
      code.contents = new Lines(code.contents)

      // get the annotations that are in the comment
      const annotations = new Annotations(comment.contents.raw, language.prefix)

      return { comment, code, inline, annotations }
    })
  }

  parseTokens(tokens) {
    const { log } = this.options
    const file = this.file

    return this.map(tokens, (token) => {
      if (is.empty(token)) return token
      const { annotations, ...base } = token
      token.parsed = to.reduce(annotations, (result, annotation) => {
        const current = this.api.run('parse', { annotation, ...base, file, log })
        if (result != null) {
          return to.merge(result, {
            [annotation.name]: current
          })
        }
      }, {})

      return token
    })
  }

  autofillTokens(tokens) {
    const { log } = this.options
    const file = this.file
    const autofill_list = to.keys(this.api.annotations.autofill)

    return this.map(tokens, (token) => {
      const base = { file, log, ...token }
      const parsed_keys = to.keys(token.parsed)
      for (let name of autofill_list) {
        if (!is.in(parsed_keys, name)) {
          const result = this.api.run('autofill', { name }, base)
          if (result != null) {
            token.parsed[name] = result
          }
        }
      }

      return token
    })
  }

  resolveTokens(tokens) {
    const { log, sort } = this.options
    const file = this.file
    let resolve_list = to.keys(this.api.annotations.resolve)
    // sort the parsed object before the annotations are resolved
    if (is.fn(sort)) {
      resolve_list = to.sort(resolve_list, sort)
    }

    return this.map(tokens, (token) => {
      const keys = to.keys(token.parsed)
      const list = resolve_list.filter((name) => is.in(keys, name))
      for (let name of list) {
        const result = this.api.run('resolve', { name, ...token, file, log, })
        if (result != null) {
          token.parsed[name] = result
        }
      }
      return token
    })
  }
}


class Annotations {
  constructor(lines) {
    this.annotations = []
    this.stash = lines
    this.iterator = to.entries(this.stash)
    this.index = 0
    this.getAnnotations()
    return this.annotations
  }

  peak(amount = 1) {
    return this.stash[this.index + amount]
  }

  next() {
    const obj = this.iterator.next().value
    if (!obj) return false
    this.index = obj[0]
    this.line = obj[1]
    return true
  }

  hasNext() {
    return !!this.peak()
  }

  getAnnotations() {
    this.next()
    this.annotation = new Annotation(this.line)
    // console.log(this.line)
    if (this.hasNext() && !this.peak().has_annotation) {
      this.next()
      this.getContent()
    }

    this.pushAnnotation()
    this.annotation = undefined

    if (this.hasNext()) {
      return this.getAnnotations()
    }

    return this.annotations
  }

  pushAnnotation() {
    let { contents, start, end, ...rest } = this.annotation

    // line.str = to.normalize(`${line}`)
    let { content, leading, trailing } = to.normalize(contents.join('\n'), { info: true })

    trailing += contents.length
    content = to.array(content)
    if (is.empty(content)) {
      contents = []
    } else {
      contents = contents
        .filter((a, i) => i >= leading && i < trailing) // filter out the lines that were removed
        .map((_line, i) => {
          _line.str = content[i] // update the lines content to be the normalized version
          return _line
        })
    }

    start = (contents[0] || {}).lineno || start || -1 // get the starting line of the comment
    end = (contents.slice(-1)[0] || {}).lineno || end || start || -1 // get the end line of the comment
    contents = new Lines(contents)
    this.annotations.push({ contents, start, end, ...rest })
  }

  getContent() {
    // console.log(this.line)
    this.annotation.contents.push(this.line)
    if (this.hasNext() && !this.peak().has_annotation) {
      this.next()
      return this.getContent()
    }
  }
}

class Annotation {
  constructor(line) {
    const { annotation: name, alias, lineno: start } = line
    return {
      name, // sets the current annotation name
      alias,
      contents: [ line ],
      start,
      end: 0
    }
  }
}

class Lines {
  constructor(lines) {
    this.lines = to.array(to.string(lines))
    this.lines.raw = lines
    return this.lines
  }
}
