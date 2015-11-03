import Purdy from './purdy'
import $ from 'clor'

let chevron = '\xBB'
let check = '\u2713'
let warning = '\u26A0'
let error = '\u2326'

const messaging = {
  warning: $.yellow.bold(`${warning} [WARNING]`),
  debug: $.magenta.bold(`${chevron}[DEBUG]`),
  error: $.red.bold(`${error}[ERROR]`),
  file: $.bgBlue.white(`${chevron}[FILE]`)
}

const purdy = new Purdy()

export default class Logger {
  constructor(options = {}) {
    this.events = []
    this.times = {}

    this.report(options)
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

  print(...args) {
    purdy.print(...args)
    return this
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

    if (debug) {
      this
        .on('debug', (...args) => this.debug(...args))
        .on('file', (...args) => this.file(...args))
    }

    if (warning) this.on('warning', (...args) => this.warn(...args))
  }

  warn(...args) {
    console.log(
      '\n\n',
      messaging.warning,
      '\n',
      ...purdy.format(...args)
    )
    return this
  }

  error(arg) {
    console.log(
      '\n\n',
      messaging.error,
      '\n',
      ...purdy.format(arg)
    )
    return this
  }

  time(label) {
    this.times[label] = Date.now()
    return this
  }

  time_end(label, format = '%s completed after %dms') {
    let time = this.times[label]

    if (!time) {
      throw new Error(`No such label: ${label}`)
    }

    let duration = Date.now() - time
    console.log(
      `${$.green(check)} ${format}`,
      label,
      duration
    )
    return this
  }

  debug(...args) {
    console.log(
      '\n\n',
      messaging.debug,
      '\n',
      ...purdy.format(...args)
    )
    return this
  }

  file(file) {
    console.log(
      '\n\n',
      messaging.file,
      file,
      ''
    )
    return this
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
