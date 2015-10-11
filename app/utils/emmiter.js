export default class Emitter {
  constructor() {
    this.events = []
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
  emit(name, obj) {
    (this.events[name] || []).forEach((event) => event.call(this, obj))
    return this
  }
}