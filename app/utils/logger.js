import Purdy from './purdy'
import clor from 'clor'


let icon = {
  chevron: '\xBB ',
  check: '\u2713 ',
  warning: '\u26A0 ',
  error: '\u2326 '
}

const messaging = {
  warning: clor.yellow.bold(`${icon.warning} [WARNING]`),
  debug: clor.magenta.bold(`${icon.chevron}[DEBUG]`),
  error: clor.red.bold(`${icon.error}[ERROR]`),
  file: clor.bgBlue.white(`${icon.chevron}[FILE]`)
}

const purdy = new Purdy()

export default class Logger {
  constructor(options = {}) {
    this.events = []
    this.times = {}
    this.options = options


    this.report()
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

  report() {
    let {
      debug = true,
      warning = true,
      timestamps = true
    } = this.options

    this.on('annotation_error', ({ annotation, error_message }) =>
      this.error(`with ${annotation}`, error_message))

    if (timestamps) {
      this
        .on('start', (name) => this.time(name))
        .on('complete', (name, format = '%s finished after %dms') =>
          this.timeEnd(name, format))
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

  timeEnd(label, format = '%s completed after %dms') {
    let time = this.times[label]

    if (!time) {
      throw new Error(`No such label: ${label}`)
    }

    let duration = Date.now() - time
    console.log(
      `${clor.green(icon.check)} ${format}`,
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
