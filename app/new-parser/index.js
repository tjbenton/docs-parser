import { info, fs, is, to } from '../utils'
import AnnotationApi from '../new-annotation-api'
import * as annotations from '../annotations'
import path from 'path'
// import getBlocks from '../../get-blocks'
// import parseBlocks from '../parser/parse-blocks'
import getConfig from '../config'
import tokenizer from './tokenizer'
import clor from 'clor'

export default async function parser(file_path, settings = {}) {
  if (is.empty(settings)) {
    settings = await getConfig()
  }
  // {
  //   languages,
  //   annotations,
  //   blank_lines,
  //   sort,
  //   log
  // }

  const contents = to.normalString(await fs.readFile(file_path))

  // {
  //   file_path,
  //   comments,
  //   languages,
  //   annotations,
  //   blank_lines,
  //   sort,
  //   log
  // }
  return new Parser({ path: file_path, contents }, settings)
}

// parser.prototype.fn = Parser.prototype

class Parser extends AnnotationApi {
  constructor(file, settings) {
    // the filetype of the current file
    const type = path.extname(file.path).replace('.', '')

    // file.contents = replaceAliases()
    const language = settings.languages[type] ? settings.languages[type] : settings.languages.default

    to.extend(file, {
      path: path.join(info.dir, path.relative(info.root, file.path)) || file.path, // path of the file
      name: path.basename(file.path, `.${type}`), // name of the file
      type, // filetype of the file
      options: language, // @todo remove this
      settings: language,
      start: 1, // starting point of the file
      end: to.array(file.contents).length - 1 // ending point of the file
    })

    super({ annotations, file })

    this.language = language

    to.extend(this, to.filter(settings, ({ key }) => {
      return is.in([ 'blank_lines', 'sort', 'log' ], key)
    }))

    // removes aliases from the file contents
    this.replaceAliases()

    // a) The file doesn't contain any header level comments, or body level comments
    if (!is.any.in(file.contents, ...to.values(file.options.header, '!type'), ...to.values(file.options.body, '!type'))) {
      this.log.emit('warning', `Well shitfire, ${clor.bold(file.path)} doesn't contain any sweet documentation`)
      return []
    }

    return this.parse()
  }

  parse() {
    let tokens = tokenizer(this)
  }

  replaceAliases() {
    let comment_types = to.flatten([
      ...to.values(this.language.header, '!type', '!end'),
      ...to.values(this.language.body, '!type', '!end')
    ])
      .filter(Boolean)
      .map((comment_type) => '\\' + comment_type.split('').join('\\')) // this escapes every character (aka `/**` ==> `\\/\\*\\*`)
    comment_types = `(?:${comment_types.join('|')})`
    let block_comment = `(?:^(?:\\s*${comment_types})?\\s*)`
    let inline_comment = `(?:${comment_types}?${this.language.inline_prefix}\\s+)`
    let comment_regex = `((?:${block_comment}|${inline_comment})${this.language.prefix})`

    let alias_obj = to.reduce(this.annotations.alias, (previous, { key, value }) => {
      value = value
        .filter((alias) => !is.in(this.annotations.main, alias))
        .reduce((a, b) => to.extend(a, { [b]: key }), {})
      return to.extend(previous, value)
    }, {})

    const alias_list_regex = new RegExp(`${comment_regex}(${to.keys(alias_obj).join('|')})\\b`, 'gm')

    this.file.contents.replace(alias_list_regex, (match, comment_match, alias) => comment_match + alias_obj[alias])
  }
}
