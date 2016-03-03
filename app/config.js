/* eslint-disable guard-for-in */
import { info, fs, is, to, Logger } from './utils'
import path from 'path'
import annotations from './annotations'
import AnnotationApi from './annotation-api'

let log = new Logger()

// changed by `options` key
export const default_options = {
  config: `${info.root}/.docsfile.js`,

  // files to parse for documentation
  files: [ 'app/**/*', 'src/**/*', '*.md' ],

  // files to be ignored
  ignore: [
    '.*', // all dot files
    'node_modules/', 'bower_components/', 'jspm_packages/', // package managers
    'dist/', 'build/', 'docs/', // normal folders
    'tests/', 'coverage/' // unit tests and coverage results
  ],
  page_fallback: 'general', // used if `@page` isn't defined

  // add gitignore files to the ignore list. Depending on ignored files it
  // could cause things to ge parsed slower, that's why it's defaulted to `false`
  gitignore: false,

  // determins if only changed files should be parsed or not
  changed: true,

  // this stops the current block from adding lines if there're `n`
  // blank line lines between code, and starts a new block.
  blank_lines: 4,
  debug: true,
  warning: true,
  timestamps: true,

  // this will return the raw data by file, aka data won't be sorted
  raw: false,

  // this is used to sort the annotations to be in a specific order after
  // the block has been parsed initial and before the the resolve functions run
  // for each annotation. You can manipulate this list to ensure that a specific
  // annotation resolves before another one does, this is used in the event that
  // one annotation depends on another annotation to be resolved first
  sort(a, b) {
    return a.localeCompare(b) // same as the default sort function
  },

  // default annotation list
  annotations,
}

export const default_comment = {
  prefix: '@', // annotation identifier(this should probably never be changed)
  inline_prefix: '#', // @todo add support for this single line prefix for comments inside of the code below the comment block
  // file level comment block identifier
  header: { start: '////', line: '///', end: '////', type: 'header' },
  // block level comment block identifier
  body: { start: '', line: '///', end: '', type: 'body' },
  // this is used for any interpolations that might occur in
  // annotations. I don't see this needing to change but just incase
  // I'm making it a setting.
  // @note {10} This setting is used to create a RegExp so certain characters need to be escaped
  interpolation: {
    start: '\${',
    end: '}'
  },
}

// some defaults for common languages
export const comments = {
  _: default_comment,
  css: {
    header: { start: '/***', line: '*', end: '***/' },
    body: { start: '/**', line: '*', end: '**/' }
  },
  'rb, py, coffee, sh, bash, pl': {
    header: { start: '###', line: '##', end: '###' },
    body: { line: '##' }
  },
  'html, md, markdown, mark, mdown, mkdn, mdml, mkd, mdwn, mdtxt, mdtext, text': {
    header: { start: '<!----', line: '', end: '---->' },
    body: { start: '<!---', line: '', end: '--->' }
  },
  jade: {
    header: { start: '//-//', line: '//-/', end: '//-//' },
    body: { line: '//-/' }
  },
  cfm: {
    header: { start: '<!-----', line: '', end: '----->' },
    body: { start: '<!----', line: '', end: '---->' }
  }
}


export const base_config = {
  ...default_options,
  comments
}

export default async function config(options = {}) {
  let config_file = (options.config ? options : base_config).config

  // try to get the `docsfile.js` so the user config can be merged
  try {
    // merge the default options with the user options
    config_file = require(config_file)
  } catch (err) {
    config_file = {}
  }

  // merge the config file with passed options
  options = to.extend(ensureValidConfig(config_file), options)

  // ensures `files`, `ignore` is always an array this way no
  // more checks have to happen for it
  if (options.files) options.files = to.array(options.files)
  if (options.ignore) options.ignore = to.array(options.ignore)


  // merge options with base_config so there's a complete list of settings
  options = to.extend(to.extend({}, base_config), options)

  if (options.gitignore) {
    try {
      options.ignore = to.flatten([
        options.ignore,
        to.array(to.string(await fs.readFile(path.join(info.root, '.gitignore'))))
      ])
    } catch (err) {
      // do nothing because there's no `.gitignore`
    }
  }

  // always ignore json files because they don't support comments
  options.ignore.push('*.json')

  // ensures blank_lines is a number to avoid errors
  options.blank_lines = to.number(options.blank_lines)

  options.comments = parseComments(options.comments)

  options.annotations = new AnnotationApi(options.annotations)
  return options
}


let valid_options = to.keys(default_options)
let valid_comment_options = to.keys(default_comment)


export function parseComments(comments) {
  let parsed_comments = {}

  // ensures comments are a normal structure (aka not `'rb, py': {...}`)
  for (let [ option, value ] of to.entries(comments)) {
    // converts option into an array so multiple languages can be declared at the same time
    option = option.replace(/\s/g, '').split(',')

    for (let lang in option) parsed_comments[option[lang]] = value
  }

  // ensures each comment as all the required comment settings
  // this makes it easier later on when parsing
  for (let [ lang, value ] of to.entries(parsed_comments)) {
    if (lang !== '_') {
      parsed_comments[lang] = to.extend(to.clone(default_comment), value)
    }
  }

  // extend any languages that have the extend option
  for (let [ lang, value ] of to.entries(parsed_comments)) {
    if (
      lang !== '_' &&
      value.extend
    ) {
      if (!parsed_comments[value.extend]) {
        throw new Error(`${value.extend} comment style doesn't exist`)
      } else if (!is.string(value.extend)) {
        throw new Error(`the value of extend must be a string you passed ${value.extend}`)
      } else {
        parsed_comments[lang] = to.extend(value, to.clone(parsed_comments[value.extend]))
      }
    }
    delete parsed_comments[lang].extend
  }

  return parsed_comments
}

/// @name ensureValidConfig
/// @description
/// Ensures that the user set's a valid config
/// @access private
function ensureValidConfig(user_config) {
  for (let key in user_config) {
    if (!is.in(valid_options, key)) {
      log.emit('warning', `'${key}' is not a valid option, see docs options for more details`) //# @todo add link to the doc options
    }
  }

  // ensures the newly added language has the correct comment format
  if (user_config.comments) {
    for (let lang in user_config.comments) {
      for (let type in lang) {
        if (!is.in(valid_comment_options, type)) {
          log.emit('warning', `'${type}' is not a valid comment option in '${lang}', must be 'header', or 'body'`)
        }
      }
    }
  }

  return user_config
}
