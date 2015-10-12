import pkg from '../package.json'
import path from 'path'
import {info, fs} from './utils.js'
import program from 'commander'
import docs from './docs.js'
import {base_config} from './config.js'

export default function cli(argv) {
  // helper functions to parse passed options
  const to_list = (str) => str.replace(/\s/g, '').split(',').filter(Boolean)
  const to_boolean = (str) => str !== 'false' ? true : false
  const to_number = (str) => ~~str

  program
    .version(pkg.version)
    .usage('docs [options]')
    .description(`
      Parse all your documentation, and output a json file.

      Note:
      If you want to select \`.*\` file by it's self you have to add
      quotes around it, or a trailing comma. This is a issue with 'commander'.
    `)
    .option('-c, --config [path]', `Path to configuration file`, base_config.config)
    .option('-f, --files <glob1,[glob2,...]>', `Paths to parsed`, to_list, base_config.files)
    .option('-i, --ignore <glob1,[glob2,...]>', `Paths to ignore`, to_list, base_config.ignore)
    .option('-a, --changed [boolean]', `Parse changed files`, to_boolean, base_config.changed)
    .option('-b, --blank-lines <n>', `Stops parsing lines after <n> consecutive blank lines`, to_number, base_config.blank_lines)
    .option('-d, --dest [path]', 'Documentation folder', `${info.root}/docs/docs.json`)
    .parse(process.argv)

  // @todo update docs function to work like this
  // docs({
  //   config,
  //   files,
  //   ignore,
  //   changed,
  //   blankLines: blank_lines
  // } = program)
  //   .then((parsed) => fs.outputJson(dest, parsed))
}