import {format as _format} from 'util'
import chalk from 'chalk'

let _times = {}
let chevron = '\xBB'
let check = '\u2713'
let warning = '\u26A0'
let error = '\u2326'

// @name Log
// @description
// A better console.log
function log(...args) {
  console.log(_format(`${chalk.green(chevron)} ${args.shift()}`, ...args))
}

log.warn = (...args) => {
  console.log(_format(`${chalk.yellow(warning, chalk.bold.yellow('[WARNING]'))} ${args.shift()}`, ...args), '\n')
}

log.error = (...args) => {
  console.trace(...args)
  console.log(_format(`${chalk.red(error, chalk.bold.red('[ERROR]'))} ${args.shift()}`, ...args), '\n')
}

log.time = (label) => {
  _times[label] = Date.now()
}

log.timeEnd = (label, format = '%s completed after %dms') => {
  let time = _times[label]

  if (!time) {
    throw new Error(`No such label: ${label}`)
  }

  let duration = Date.now() - time
  console.log(_format(`${chalk.green(check)} ${format}`, label, duration))
}

log.debug = (...args) => {
  args = args.map((f) => {
    if (f instanceof Function) {
      return f()
    }

    return f
  })

  console.log(_format(`${chalk.styles.grey.open}${arrow} [DEBUG] ${args.shift()}`, ...args, chalk.styles.grey.close), '\n')
}


export default log