const to_string = (arg) => Object.prototype.toString.call(arg)
const array_slice = (arg) => Array.prototype.slice.call(arg)

import to from './to.js'

let is = {
  // placeholder for the interfaces
  not: {},
  all: {},
  any: {},

  /// @name is.argument
  /// @description is a given arg Arguments?
  /// fallback check is for IE
  /// @arg {*} arg - The item to check
  /// @returns {boolean} - The result of the test
  argument: (arg) => !is.null(arg) && (to_string.call(arg) === '[object Arguments]' || (typeof arg === 'object' && 'callee' in arg)),

  /// @name is.regex
  /// @description is a given arg regex expression?
  /// @arg {*} arg - The item to check
  /// @returns {boolean} - The result of the test
  regex: (value) => to_string.call(value) === '[object RegExp]',

  /// @name is.func
  /// @description is a given arg function?
  /// @arg {*} arg - The item to check
  /// @returns {boolean} - The result of the test
  func: (arg) => to_string(arg) === '[object Function]' || typeof arg === 'function',

  /// @name is.array
  /// @description is a given arg Array?
  /// @arg {*} arg - The item to check
  /// @returns {boolean} - The result of the test
  array: (arg) => to_string(arg) === '[object Array]',

  /// @name is.boolean
  /// @description is a given arg Boolean?
  /// @arg {*} arg - The item to check
  /// @returns {boolean} - The result of the test
  boolean: (arg) => arg === true || arg === false || to_string(arg) === '[object Boolean]',

  /// @name is.object
  /// @description is a given arg object?
  /// @arg {*} arg - The item to check
  /// @returns {boolean} - The result of the test
  object: (arg) => typeof arg === 'object' && !!arg && arg !== null,

  /// @name is.symbol
  /// @description is a given arg a symbol?
  /// @arg {*} arg - The item to check
  /// @returns {boolean} - The result of the test
  symbol: (arg) => typeof arg === 'symbol',

  /// @name is.json
  /// @description is given value a pure JSON object?
  /// @arg {*} arg - The item to check
  /// @returns {boolean} - The result of the test
  json: (arg) => to_string(arg) === '[object Object]',

  /// @name is.empty
  /// @description is a given arg empty? Objects, arrays, strings
  /// @arg {object, array, string} arg - What you want to check to see if it's empty
  /// @returns {boolean} - determins if the item you passes was empty or not
  empty: (arg) => {
    var type = typeof arg
    if (is.falsy(arg)) {
      return true
    } else if (type === 'function' || type === 'object' && !!arg) {
      let num = Object.getOwnPropertyNames(arg).length
      return (num === 0 || (num === 1 && is.array(arg)) || (num === 2 && is.argument(arg))) ? true : false
    } else {
      return arg === ''
    }
  },

  /// @name is.exsity
  /// @description is a given value existy?
  /// @arg {*} arg - The item to check
  /// @returns {boolean} - The result of the test
  existy: (arg) => arg !== null && arg !== undefined,

  /// @name is.string
  /// @description is a given arg String?
  /// @arg {*} arg - The item to check
  /// @returns {boolean} - The result of the test
  string: (arg) => to_string(arg) === '[object String]',

  /// @name is.undefined
  /// @description is a given arg undefined?
  /// @arg {*} arg - The item to check
  /// @returns {boolean}
  undefined: (arg) => arg === void 0,

  /// @name is.included
  /// @description is a given string include parameter substring?
  /// @arg {string, array} a - string to match against
  /// @arg {string, array} b - string to look for in `str`
  /// @todo {1} update this to work with arrays
  /// @todo {1} change name to be `index` because it still makes sense and it's shorter
  /// @returns {number, boolean}
  included: (a, b) => !is.empty(a) && !is.empty(b) && a.indexOf(b) > -1 ? a.indexOf(b) : false,

  /// @name is.in
  /// @description is the `value` in `obj`?
  /// @arg {array, string, object} obj - the item to check against
  /// @arg {*} value - the value to look for in the `obj`
  /// @returns {boolean}
  in: (obj, value) => is.included(is.object(obj) ? to.keys(obj) : obj, value) !== false,

  /// @name is.false
  /// @description is a given arg false
  /// @arg {*} arg - arg to check if it is false
  /// @returns {boolean}
  false: (arg) => arg === false,

  /// @name is.truthy
  /// @description is a given arg truthy?
  /// @arg {*} arg
  /// @returns {boolean}
  truthy: (arg) => arg !== null && arg !== undefined && arg !== false && !(arg !== arg) && arg !== '' && arg !== 0,

  /// @name is.falsy
  /// @description is given arg falsy?
  /// @arg {*} arg
  /// @returns {boolean}
  falsy: (arg) => !is.truthy(arg),

  /// @name is.nan
  /// @description NaN is number, also it is the only arg which does not equal itself
  /// @arg {*} arg
  /// @returns {boolean}
  nan: (arg) => arg !== arg,

  /// @name is.number
  /// @description is given arg a number?
  /// @arg {*} arg
  /// @returns {boolean}
  number: (arg) => is.not.nan(arg) && to_string(arg) === '[object Number]',

  /// @name is.between
  /// @description is a given number within minimum and maximum parameters?
  /// @arg {*} arg
  /// @arg {number} min [0]
  /// @arg {number} max [Infinity]
  /// @returns {boolean}
  between: (arg, min = 0, max = Infinity) => is.all.number(arg, min, max) && (arg >= min && arg <= max),

  /// @name is.positive
  /// @description is a given number positive?
  /// @arg {*} arg
  /// @returns {boolean}
  positive: (arg) => is.number(arg) && arg > 0,

  /// @name is.negative
  /// @description is a given number negative?
  /// @arg {*} arg
  /// @returns {boolean}
  negative: (arg) => is.number(arg) && arg < 0,

  /// @name is.above
  /// @description is a given number above minimum parameter?
  /// @arg {*} arg
  /// @arg {number} min [-1]
  /// @returns {boolean}
  above: (arg, min = -1) => is.all.number(arg, min) && arg > min,

  /// @name is.under
  /// @description is a given number above maximum parameter?
  /// @arg {*} arg
  /// @arg {number} max [100]
  /// @returns {boolean}
  under: (arg, max = 100) => is.all.number(arg, max) && arg < max,

  /// @name is.null
  /// @description is a given arg null?
  /// @arg {*} arg - the item you want to check and see if it's `null`
  /// @returns {boolean}
  null: (arg) => arg === null,

  /// @name is.promise
  /// @description is a given arg a promise?
  /// @arg {*} arg - the item you want to check and see if it's a `Promise`
  /// @returns {boolean}
  promise: (arg) => arg && is.func(arg.then),

  /// @name is.stream
  /// @description is a given arg a stream?
  /// @arg {*} arg - the item you want to check and see if it's a `stream`
  /// @returns {boolean}
  stream: (arg) => arg && is.func(arg.pipe),

  /// @name is.buffer
  /// @description is a given arg a stream?
  /// @arg {*} arg - the item you want to check and see if it's a `stream`
  /// @returns {boolean}
  buffer: (arg) => Buffer.isBuffer(arg)
}

// included method does not support `all` and `any` interfaces
is.included.api = ['not']

// within method does not support `all` and `any` interfaces
is.between.api = ['not']

// `above` method does not support `all` and `any` interfaces
is.above.api = ['not']

// least method does not support `all` and `any` interfaces
is.under.api = ['not']


is.in.api = ['not']

is.all.in = (obj, ...values) => {
  values = to.array.flat(values)
  for (let i in values) {
    if (!is.in(obj, values[i])) {
      return false
    }
  }
  return true
}

is.any.in = (obj, ...values) => {
  values = to.array.flat(values)
  for (let i in values) {
    if (is.in(obj, values[i])) {
      return true
    }
  }
  return false
}

const not = (func) => () => !func.apply(null, array_slice(arguments))

const all = (func) => {
  return function() {
    let parameters = array_slice(arguments)
    let length = parameters.length

    // support array
    if (length === 1 && is.array(parameters[0])) {
      parameters = parameters[0]
      length = parameters.length
    }

    for (let i = 0, l = length; i < length; i++) {
      if (!func.call(null, parameters[i])) {
        return false
      }
    }

    return true
  }
}

const any = (func) => {
  return function() {
    let parameters = array_slice(arguments)
    let length = parameters.length

    // support array
    if (length === 1 && is.array(parameters[0])) {
      parameters = parameters[0]
      length = parameters.length
    }

    for (var i = 0, l = length; i < l; i++) {
      if (func.call(null, parameters[i])) {
        return true
      }
    }

    return false
  }
}

;(function setInterfaces() {
  let options = is
  for (var option in options) {
    if (hasOwnProperty.call(options, option) && is.func(options[option])) {
      var interfaces = options[option].api || ['not', 'all', 'any']
      for (let i in interfaces) {
        if (interfaces[i] === 'not') {
          is.not[option] = not(is[option])
        }
        if (interfaces[i] === 'all') {
          is.all[option] = all(is[option])
        }
        if (interfaces[i] === 'any') {
          is.any[option] = any(is[option])
        }
      }
    }
  }
})()

export default is