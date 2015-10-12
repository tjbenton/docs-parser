import {info, fs, is, to, log} from './utils.js'

// changed by `options` key
const default_options = {
  files: 'app/**/*', // files to search
  ignore: ['.*','node_modules/', 'bower_components/', 'jspm_packages/'], // files to be ignored
  changed: true, // determins if only changed files should be parsed or not
  blank_lines: 4, // @todo this stops the current block from adding lines if there're `n` blank line lines between code, and starts a new block.
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
let comments = {
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

export default function config(options = `${info.root}/docs.js`) {
  let base_config = {
    ...default_options,
    comments
  }

  // try to get the docs file from the passed filepath
  if (is.string(options)) {
    try {
      options = require(options)
    } catch(err) {
      options = {}
    }
  }

  if (is.object(options)) {
    // ensures `ignore` is always an array
    if (options.ignore) {
      options.ignore = to.array(options.ignore)
    }

    // merge the default options with the user options
    options = to.extend(base_config, ensure_valid_config(options))

    let comments = {};
    for (let [option, value] of to.entries(options.comments)){
      // converts option into an array so multiple languages can be declared at the same time
      option = option.replace(/\s/g, '').split(',');

      for (let lang in option) comments[option[lang]] = value;
    }

    options.comments = comments;


    return options;
  } else {
    log.error(`config only accepts path to config file, or '{}' of the options`)
  }
}


let valid_options = to.keys(default_options);
let valid_comment_options = to.keys(default_comment);

/// @name ensure_valid_config
/// @description
/// Ensures that the user set's a valid config
/// @access private
function ensure_valid_config(user_config) {
  for (let key in user_config) {
    if (!is.included(valid_options, key)) {
      log.warn(`'${key}' is not a valid option, see docs options for more details`); //# @todo add link to the doc options
    }
  }

  // ensures the newly added language has the correct comment format
  if (user_config.comments) {
    for (let lang in user_config.comments) {
      for (let type in lang) {
        if (!is.included(valid_comment_options, type)) {
          log.warn(`'${type}' is not a valid comment option in '${lang}', must be 'header', or 'body'`);
        }
      }
    }
  }

  return user_config;
}