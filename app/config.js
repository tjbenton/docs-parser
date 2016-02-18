/* eslint-disable guard-for-in */
import { info, fs, is, to, Logger } from './utils'
import path from 'path'
import annotations from './annotations'
import AnnotationApi from './annotation_api'

let log = new Logger()

// changed by `options` key
const default_options = {
  config: `${info.root}/.docsfile.js`,
  files: [ 'app/**/*', 'src/**/*', '*.md' ], // files to search
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
  changed: true, // determins if only changed files should be parsed or not
  blank_lines: 4, // @todo this stops the current block from adding lines if there're `n` blank line lines between code, and starts a new block.
  debug: true,
  warning: true,
  timestamps: true,
  raw: false, // this will return the raw data by file, aka data won't be sorted
  annotations
}

const default_comment = {
  prefix: '@', // annotation identifier(this should probably never be changed)
  inline_prefix: '#', // @todo add support for this single line prefix for comments inside of the code below the comment block
  // file level comment block identifier
  header: { start: '////', line: '///', end: '////' },
  // block level comment block identifier
  body: { start: '', line: '///', end: '' }
}

// some defaults for common languages
const comments = {
  _: default_comment,
  css: {
    header: { start: '/***', line: '*', end: '***/' },
    body: { start: '/**', line: '*', end: '**/' }
  },
  'rb, py': {
    header: { start: '###', line: '##', end: '###' },
    body: { line: '#' }
  },
  'html, md, markdown, mark, mdown, mkdn, mdml, mkd, mdwn, mdtxt, mdtext, text': {
    header: { start: '<!----', end: '/--->' },
    body: { start: '<!---', end: '/-->' }
  },
  cfm: {
    header: { start: '<!-----', end: '/--->' },
    body: { start: '<!----', end: '/--->' }
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
  options = to.extend(ensure_valid_config(config_file), options)

  // merge options with base_config so there's a complete list of settings
  options = to.extend(base_config, options)

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


  // ensures `files`, `ignore` is always an array this way no
  // more checks have to happen for it
  options.files = to.array(options.files)
  options.ignore = to.array(options.ignore)

  // ensures blank_lines is a number to avoid errors
  options.blank_lines = to.number(options.blank_lines)

  let parsed_comments = {}

  // ensures comments are a normal structure (aka not `'rb, py': {...}`)
  for (let [ option, value ] of to.entries(options.comments)) {
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

  options.comments = parsed_comments

  options.annotations = new AnnotationApi(options.annotations)

  return options
}


let valid_options = to.keys(default_options)
let valid_comment_options = to.keys(default_comment)

/// @name ensure_valid_config
/// @description
/// Ensures that the user set's a valid config
/// @access private
function ensure_valid_config(user_config) {
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
