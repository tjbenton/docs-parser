import {format as _format} from 'util'
import chalk from 'chalk'

let chevron = '\xBB'
let check = '\u2713'
let warning = '\u26A0'
let error = '\u2326'

export default class Logger {
  constructor() {
    this.events = []
    this.times = {}
  }

  /// @description
  /// Observe an event.
  /// @arg {string} name of event to observe
  /// @arg {function} handler
  on(name, cb) {
    (this.events[name] = this.events[name] || []).push(cb)
    return this
  }

  /// @description Emit an event to observers.
  /// @arg {string} name of event to emit
  /// @arg {object} data to send
  emit(name, ...args) {
    (this.events[name] || []).forEach((event) => event.call(this, ...args))
    return this
  }

  log(...args) {
    console.log(_format(`${chalk.green(chevron)} ${args.shift()}`, ...args))
  }

  warn(...args) {
    console.log(_format(`${chalk.yellow(warning, chalk.bold.yellow('[WARNING]'))} ${args.shift()}`, ...args), '\n')
  }

  error(...args) {
    console.trace(...args)
    console.log(_format(`${chalk.red(error, chalk.bold.red('[ERROR]'))} ${args.shift()}`, ...args), '\n')
  }

  time(label) {
    this.times[label] = Date.now()
  }

  time_end(label, format = '%s completed after %dms') {
    let time = this.times[label]

    if (!time) {
      throw new Error(`No such label: ${label}`)
    }

    let duration = Date.now() - time
    console.log(_format(`${chalk.green(check)} ${format}`, label, duration))
  }

  debug(...args) {
    args = args.map((f) => {
      if (f instanceof Function) {
        return f()
      }

      return f
    })

    console.log(_format(`${chalk.styles.grey.open}${arrow} [DEBUG] ${args.shift()}`, ...args, chalk.styles.grey.close), '\n')
  }
}