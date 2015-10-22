import pkg from '../package.json'
import {info, fs} from './utils'
import program from 'commander'
import docs from './docs'
import {base_config} from './config'

export default function cli() {
  // helper functions to parse passed options
  const to_list = (str) => str.replace(/\s/g, '').split(',').filter(Boolean)
  const to_boolean = (str) => str !== 'false' ? true : false
  const to_number = (str) => ~~str

  program
    .version(pkg.version)
    .usage('docs [options]')
    .description(`
      Parse all your documentation, and output a json file. To see all the default options
      see @todo add a link to the options

      Note: Put globs quotes \`'.*, app/**/*'\` to avoid issues
    `)
    .option('-d, --dest [path]', 'Documentation folder', `${info.root}/docs/docs.json`)
    .option('-c, --config [path]', `Path to configuration file`, base_config.config)
    .option('-f, --files <glob1,[glob2,...]>', `Paths to parsed`, to_list, base_config.files)
    .option('-i, --ignore <glob1,[glob2,...]>', `Paths to ignore`, to_list, base_config.ignore)
    .option('-g, --gitignore', 'Add `gitignore` files to the ignored files', base_config.gitignore)
    .option('-x, --debug [boolean]', 'Output debugging information', to_boolean, base_config.debug)
    .option('-w, --warning [boolean]', 'Output warning messages', to_boolean, base_config.warning)
    .option('-t, --timestamps [boolean]', 'Output timestamps of how long it takes to parse the files', to_boolean, base_config.timestamps)
    .option('-a, --changed [boolean]', `Parse changed files`, to_boolean, base_config.changed)
    .option('-b, --blank-lines <n>', `Stops parsing lines after <n> consecutive blank lines`, to_number, base_config.blank_lines)
    .parse(process.argv)

  return docs({
    ...program,
    blank_lines: program.blankLines,
  })
    .then((parsed) => fs.outputJson(program.dest, parsed, { spaces: 2 }))
    .catch((err) => console.error(err.stack))
}