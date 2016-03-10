import { is, to, Logger } from './'
import clor from 'clor'

/// @name debug
/// @description
/// This is a ES7/ES2016 decorator function. It adds helpful debugging capabilities
/// to any class with the option to turn it off an on with ease
///
/// @arg {boolean} value [false] determins if you want to debug your function
///
/// @markup Basic Setup
/// @debug()
/// class MyClass {}
///
/// @markup Debugging information
/// class MyClass {
///   constructor(str) {
///     this.lines = str.split('\n')
///     ...
///     return this.parse()
///   }
///   parse() {
///     for ( let [ lineno, line] of this.lines.entries()) {
///       this.debug('lineno', lineno)
///       this.debug('line', line)
///       this.debug('other useful information')
///
///       this.runDebug()
///     }
///   }
/// }
///
/// const test = new MyClass(
/// `
/// var foo = 'bar'
/// var bar = 'bar'
/// `
/// )
///
/// @markup Yields
/// [user:~/path/to/project]$
///
///
/// » [DEBUG]
/// lineno: 0
/// line:
///
///
/// » [DEBUG]
/// lineno: 1
/// line: var foo = 'bar'
///
///
/// » [DEBUG]
/// lineno: 2
/// line: var bar = 'bar'
///
///
/// » [DEBUG]
/// lineno: 3
/// line:
///
/// @markup Multiple debuggers
/// class MyClass {
///   ...
///   parse() {
///     const parseDebug = this.debugSet()
///     for ( let [ lineno, line] of this.lines.entries()) {
///       parseDebug.debug('lineno', lineno)
///       parseDebug.debug('line', line)
///       parseDebug.debug('other useful information')
///
///       parseDebug.runDebug()
///     }
///   }
/// }
///
export default function debug(default_name = 'DEBUG', value = false, default_color = 'magenta') {
  const color_list = [ 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'gray' ].filter((color) => color !== default_color)
  const icon_chevron = '\xBB '
  const base = clor[default_color].bold(`${icon_chevron}[${default_name}]:`)

  return function debugDecorator(target) {
    let log = target.log || new Logger()
    /// @name define
    /// This function helps define properties on an object
    /// @description
    /// @private
    function define(obj, name, val, options = {}) {
      Object.defineProperty(obj, name, {
        configurable: true,
        writable: true,
        enumerable: false,
        value: val,
        ...options
      })
    }

    class Debugger {
      constructor(name = '', val, color = default_color, context) {
        this.should_debug = val
        this.__debug_list = []
        this.__color = color
        this.__name = name
        let self = this
        return function boundDebugger() {
          this.should_debug = self.should_debug
          define(this, '__default_name', self.__name)
          define(this, '__name', self.__name)
          define(this, '__color', self.__color)
          // this ensures the __debug_list won't show up as enumerable in
          // the object it's applied to called object
          define(this, '__debug_list', self.__debug_list)
        }.bind(context || this)()
      }

      debug(...args) {
        this.__debug_list.push(...args)
        return this.should_debug
      }

      debugIfTrue(arg, ...args) {
        if (is.truthy(arg)) {
          this.__debug_list.push(...args)
        }
        return arg
      }

      debugIfFalse(arg, ...args) {
        if (is.false(arg)) {
          this.__debug_list.push(...args)
        }
        return arg
      }

      debugWrap(arg, cb, ...args) {
        if (is.function(cb)) {
          console.log('debugWrap must use have a callback')
          if (cb(arg)) {
            this.__debug_list.push(...args)
          }
        }
        return arg
      }

      runDebug() {
        if (this.should_debug && this.__debug_list.length > 0) {
          console.log('')
          console.log('')
          console.log(`${base} ${clor[this.__color].bold(this.__name)}`)
          this.__debug_list.slice(0, 1).forEach((obj) => log.print(obj))
          this.__debug_list.slice(1).forEach((obj) => log.print(obj))
          // update the debug list to be empty
          define(this, '__debug_list', [])
        }
      }
    }

    const default_debugger = new Debugger('', value, default_color, target.prototype)
    target.prototype.debug = default_debugger.debug
    target.prototype.runDebug = default_debugger.runDebug
    target.prototype.debugIfTrue = default_debugger.debugIfTrue
    target.prototype.debugIfFalse = default_debugger.debugIfFalse
    target.prototype.debugSet = function debugSet(name = '', val = value, color = to.random(color_list)) {
      return new Debugger(name, val, color)
    }

    return target
  }
}
