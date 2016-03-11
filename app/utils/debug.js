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
export default function debug(default_name = 'DEBUG', default_should_debug = false, default_options = {}) {
  try {
    let color_list = [ 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'gray' ]
    default_options = to.extend({ seperator: 2, color: to.random(color_list) }, default_options)
    color_list = color_list.filter((color_name) => color_name !== default_options.color)
    const log = new Logger()
    const icon_chevron = '\xBB '
    default_name = clor[default_options.color].bold(`${icon_chevron}[${default_name}]:`)

    class Debugger {
      constructor(name = 'Define a Name', should_debug, options = {}) {
        if (is.plainObject(should_debug)) {
          options = should_debug
          should_debug = options.should_debug || default_should_debug
        }
        this.should_debug = should_debug
        this.debug_list = []
        this.name = name
        this.color = options.color
        this.seperator = options.seperator
      }

      debug(...args) {
        this.debug_list.push(...args)
        return this.should_debug
      }

      push(...args) {
        return this.debug(...args)
      }

      add(...args) {
        return this.debug(...args)
      }

      debugIfTrue(arg, ...args) {
        if (is.truthy(arg)) {
          this.debug_list.push(...args)
        }
        return arg
      }

      debugIfFalse(arg, ...args) {
        if (is.false(arg)) {
          this.debug_list.push(...args)
        }
        return arg
      }

      debugWrap(arg, cb, ...args) {
        if (!is.function(cb)) {
          console.log('debugWrap must use a callback')
        }
        if (cb(arg)) {
          this.debug_list.push(...args)
        }
        return arg
      }

      run() {
        try {
          if (this.should_debug && this.debug_list.length > 0) {
            for (let i = this.seperator; i; i--) console.log('')
            console.log(this.name)
            this.debug_list.slice(0, 1).forEach((obj) => log.print(obj))
            this.debug_list.slice(1).forEach((obj) => log.print(obj))
            // update the debug list to be empty
            this.debug_list = []
          }
        } catch (e) {
          console.trace(e)
        }
      }

      debugSet(name = 'define a name silly', should_debug, options = {}) {
        if (!should_debug) {
          should_debug = this.should_debug ? this.should_debug : default_should_debug
        }

        if (!options.seperator) {
          options.seperator = this.seperator ? this.seperator : default_options.seperator
        }

        if (!options.color) {
          options.color = to.random(color_list)
        }

        if (this.name) {
          name = `${this.name} > ${clor[options.color].bold(name)}`
        } else {
          name = `${default_name} ${clor[options.color].bold(name)}`
        }

        return new Debugger(name, should_debug, options)
      }
    }

    return function debugDecorator(target) {
      target.prototype.debugSet = Debugger.prototype.debugSet
      return target
    }
  } catch (err) {
    console.trace(err)
  }
}
