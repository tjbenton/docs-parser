/* eslint-disable no-bitwise */
import pkg from '../package.json'
import { info, fs, to } from './utils'
import program from 'commander'
import docs from './docs'
import { base_config } from './config'

export default function cli() {
  // helper functions to parse passed options
  const to_list = (str) => str.replace(/\s/g, '').split(',').filter(Boolean)
  const to_boolean = () => false
  const to_number = (str) => ~~str

  program
    .version(pkg.version)
    .usage("docs [options] '<input, [input, ...]>'")
    .description(`
      Parse all your documentation, and output a json file. To see all the default options
      see @todo add a link to the options

      Note: Put globs quotes \`'.*, app/**/*'\` to avoid issues
    `)
    .option('-d, --dest [path]', 'Documentation folder', `${info.root}/docs/docs.json`)
    .option('-c, --config [path]', 'Path to configuration file', base_config.config)
    .option('-i, --ignore <glob1,[glob2,...]>', 'Paths to ignore', to_list, base_config.ignore)
    .option('-g, --gitignore', 'Add `gitignore` files to the ignored files', base_config.gitignore)
    .option('-x, --no-debug', 'Output debugging information', to_boolean, base_config.debug)
    .option('-w, --no-warning', 'Output warning messages', to_boolean, base_config.warning)
    .option('-m, --no-timestamps', 'Output timestamps of how long it takes to parse the files', to_boolean, base_config.timestamps)
    .option('-a, --no-changed', 'Parse changed files', to_boolean, base_config.changed)
    .option('-b, --blank-lines <n>', 'Stops parsing lines after <n> consecutive blank lines', to_number, base_config.blank_lines)
    .option('-p, --print', 'This will only print the results instead of outputting them', false)
    .option('-r, --raw', 'This prevents the data from each file from being sorted', false)
    .option('-t, --dry-run', 'This will run everything without outputting anything', false)
    .parse(process.argv)


  let {
    blankLines: blank_lines,
    dryRun: dry_run,
    print,
    ignore,
    gitignore,
    debug,
    warning,
    timestamps,
    changed,
    raw,
    dest,
    args
  } = program

  let files = to.flatten(args.map((arg) => to_list(arg)))

  if (!files.length) {
    files = base_config.files
  }

  return docs({
    files,
    ignore,
    gitignore,
    debug,
    warning,
    timestamps,
    changed,
    raw,
    blank_lines,
  })
    .then((parsed) => {
      if (print) {
        console.log(to.json(parsed))
      } else if (dry_run) {
        // do nothing
      } else {
        fs.outputJson(dest, parsed, { spaces: 2 })
      }
    })
    .catch((err) => console.error(err.stack))
}
