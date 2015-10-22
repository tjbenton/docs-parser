import { is, to } from './'
import {format as _format} from 'util'
import chalk from 'chalk'

let chevron = '\xBB'
let check = '\u2713'
let warning = '\u26A0'
let error = '\u2326'

export class Logger {
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
    console.log(_format(`${chalk.green(chevron)} ${args.shift()}${'\n'}`, ...args), '\n')
  }

  warn(...args) {
    console.log(_format(`${chalk.yellow(warning, chalk.bold.yellow('[WARNING]\n'))}${args.shift()}`, ...args), '\n')
  }

  error(...args) {
    console.trace(...args)
    console.log(_format(`${chalk.red(error, chalk.bold.red('[ERROR]\n'))}${args.shift()}`, awesome_report(...args)), '\n')
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
    console.log(_format(`${chalk.styles.grey.open}${chevron} [DEBUG] ${args.shift()}${'\n'}`, awesome_report(...args), chalk.styles.grey.close), '\n')
  }
}

function awesome_report(...args) {
  return '\n' + to.normalize(args.map((arg) => {
    if (is.fn(arg)) {
      arg = arg()
    }
  }).join('\n')) + '\n'
}


export class Reporter extends Logger {
  constructor(options = {}) {
    super()
    this.report(options)
  }

  report(options) {
    let {
      debug = true,
      warning = true,
      timestamps = true
    } = options

    this.on('annotation_error', ({ annotation, error }) =>
      this.error(`with ${annotation}`, error))

    if (timestamps) {
      this
        .on('start', (name) => this.time(name))
        .on('complete', (name, format = '%s finished after %dms') =>
          this.time_end(name, format))
    }

    if (debug) this.on('debug', (...args) => this.debug(...args))

    if (warning) this.on('warning', (...args) => this.warn(...args))
  }
}

// .on('fly_run', ({ path }) =>
//   log(`Flying with ${fmt.path}...`, path))
//
// .on('flyfile_not_found', ({ error }) =>
//   log(`No Flyfile Error: ${fmt.error}`, error))
//
// .on('fly_watch', () =>
//   log(`${fmt.warn}`, 'Watching files...'))
//
// .on('plugin_load', ({ plugin }) =>
//   log(`Loading plugin ${fmt.title}`, plugin))
//
// .on('plugin_error', ({ plugin, error }) =>
//   log(`${fmt.error} failed due to ${fmt.error}`, plugin, error))
//
// .on('task_error', ({ task, error }) => {
//   trace(error)
//   log(`${fmt.error} failed due to ${fmt.error}`, task, error)
// })
//
// .on('task_start', ({ task }) =>
//   log(`Starting ${fmt.start}`, task))
//
// .on('task_complete', ({ task, duration }) => {
//   const time = timeInfo(duration)
//   log(`Finished ${fmt.complete} in ${fmt.secs}`,
//     task, time.duration, time.scale)
// })