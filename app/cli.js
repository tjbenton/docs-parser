import pkg from '../package.json'
import path from 'path'
import {info, fs} from './utils.js'
import program from 'commander'
import docs from './docs.js'
import {base_config} from './config.js'

export default function cli(argv) {
  // helper functions to parse passed options
  const to_list = (str) => str.replace(/\s/g, '').split(',')
  const to_boolean = (str) => str !== 'false' ? true : false
  const to_number = (str) => ~~str

  program
    .version(pkg.version)
    .usage('docs [options]')
    .description('Parse all your documentation, and output a json file')
    .option('-c, --config [path]', `Path to configuration file (default is \`${base_config.config}\`)`)
    .option('-f, --files <glob1,[glob2,...]>', `Paths to parsed (default \`${base_config.config}\`)`, to_list)
    .option('-i, --ignore <glob1,[glob2,...]>', `Paths to ignore (default \`${base_config.ignore}\`)`, to_list)
    .option('-a, --changed [boolean]', `Parse changed files (default \`${base_config.changed}\`)`, to_boolean)
    .option('-b, --blank-lines [number]', `Stops parsing lines after <x> consecutive blank lines (default \`${base_config.blank_lines}\`)`, to_number)
    .option('-d, --dest [path]', 'Documentation folder. (default `./docs/docs.json`)')
    .parse(process.argv)

  let {
    dest = `${info.root}/docs/docs.json`,
    config = base_config.config,
    files = base_config.files,
    ignore = base_config.ignore,
    changed = base_config.changed,
    blankLines: blank_lines = base_config.blank_lines
  } = program

  let cli_options = { config, files, ignore, changed, blank_lines }

  // @todo update docs function to work like this
  // docs({ config, files, ignore, changed, blank_lines })
  //   .then((parsed) => fs.outputJson(dest, parsed))
}