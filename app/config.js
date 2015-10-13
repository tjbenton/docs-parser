import {info, fs, is, to, log} from './utils'

// changed by `options` key
const default_options = {
  config: `${info.root}/docsfile.js`,
  files: ['app/**/*'], // files to search
  ignore: ['.*', 'node_modules/', 'bower_components/', 'jspm_packages/'], // files to be ignored
  changed: true, // determins if only changed files should be parsed or not
  blank_lines: 4, // @todo this stops the current block from adding lines if there're `n` blank line lines between code, and starts a new block.
  debug: true,
  timestamps: true,
  annotations: {}
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
  html: {
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

export default function config(options = {}) {
  let config_file = (options.config ? options : base_config).config

  // try to get the `docsfile.js` so the user config can be merged
  try {
    // merge the default options with the user options
    config_file = require(config_file)
  } catch(err) {
    config_file = {}
  }

  // merge config file with passed options
  options = to.extend(options, ensure_valid_config(config_file))

  // merge options with base_config so there's a complete list of settings
  options = to.extend(to.clone(base_config), options)

  // ensures `files`, `ignore` is always an array this way no
  // more checks have to happen for it
  options.files = to.array(options.files)
  options.ignore = to.array(options.ignore)

  // ensures blank_lines is a number to avoid errors
  options.blank_lines = to.number(options.blank_lines)

  let comments = {}

  // ensures comments are a normal structure (aka not `'rb, py': {...}`)
  for (let [option, value] of to.entries(options.comments)){
    // converts option into an array so multiple languages can be declared at the same time
    option = option.replace(/\s/g, '').split(',')

    for (let lang in option) comments[option[lang]] = value
  }

  options.comments = comments


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
    if (!is.included(valid_options, key)) {
      log.warn(`'${key}' is not a valid option, see docs options for more details`) //# @todo add link to the doc options
    }
  }

  // ensures the newly added language has the correct comment format
  if (user_config.comments) {
    for (let lang in user_config.comments) {
      for (let type in lang) {
        if (!is.included(valid_comment_options, type)) {
          log.warn(`'${type}' is not a valid comment option in '${lang}', must be 'header', or 'body'`)
        }
      }
    }
  }

  return user_config
}