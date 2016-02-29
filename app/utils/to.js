const toString = (arg) => Object.prototype.toString.call(arg)
const arraySlice = (arg) => Array.prototype.slice.call(arg)

import markdown from 'marked'
import changeCase from 'change-case'
import is from './is.js'

let to = {
  /// @name to.markdown
  /// @description
  /// Helper function to convert markdown text to html
  /// For more details on how to use marked [see](https://www.npmjs.com/package/marked)
  /// @returns {string} of `html`
  markdown,

  ...changeCase,

  /// @name to.clamp
  /// @description
  /// This is used to clamp a number between a min an max value
  /// It ensures a number will always be between the passed values
  /// @returns {number}
  clamp(value, min = 0, max = Infinity) {
    if (value > max) {
      return max
    } else if (value < min) {
      return min
    }

    return value
  },

  /// @name to.string
  /// @description
  /// Converts an object, array, number, or boolean to a string
  /// @arg {string, object, array, number, boolean}
  /// @returns {string}
  string(arg, glue = '\n') {
    if (is.string(arg)) {
      return arg
    }

    if (Buffer.isBuffer(arg)) {
      return arg + ''
    }

    if (is.plainObject(arg)) {
      return toString(arg)
    }

    if (is.array(arg)) {
      return arg.join(glue)
    }

    return arg + ''
  },


  /// @name to.normalString
  /// @description
  /// The ` + ""` converts the file from a buffer to a string
  ///
  /// The `replace` fixes a extremely stupid issue with strings, that is caused by shitty microsoft computers.
  /// It removes`\r` and replaces it with `\n` from the end of the line. If this isn't here then when `match`
  /// runs it will return 1 more item in the matched array than it should(in the normalize function)
  /// http://stackoverflow.com/questions/20023625/javascript-replace-not-replacing-text-containing-literal-r-n-strings
  ///
  /// @arg {*}
  /// @returns {string} That has microsoft crap removed from it
  normalString: (str) => to.string(str).replace(/\r\n|\n/g, '\n'),

  /// @name to.keys
  /// @description
  /// Converts an object to an array of it's key names.
  /// It also get's symbols if they're set as a key name.
  /// @arg {object}
  /// @returns {array}
  keys(arg) {
    if (!is.plainObject(arg) && !is.symbol(arg)) {
      return arg
    }

    return to.flatten([ Object.getOwnPropertySymbols(arg), Object.getOwnPropertyNames(arg) ])
  },

  /// @name to.keys
  /// @description
  /// Converts an object to an array of it's values names.
  /// @arg {object}
  /// @returns {array}
  values(arg) {
    let values = []
    for (var key in arg) {
      if (arg.hasOwnProperty(key)) {
        values.push(arg[key])
      }
    }

    return values
  },

  /// @name to.entries
  /// @description
  /// Makes objects, and arrays easier to iterate over!
  ///
  /// @returns {Symbol.iterator}
  ///
  /// @markup {js} **Example:**
  /// let obj = {
  ///  first: "Jane",
  ///  last: "Doe"
  /// }
  ///
  /// for(let [key, value] of to.entries(obj)){
  ///  console.log(`${key}: ${value}`)
  /// }
  ///
  /// // Output:
  /// // first: Jane
  /// // last: Doe
  ///
  /// @markup {js} **Example:**
  /// let obj = ["Jane", "Doe"]
  ///
  /// for(let [index, value] of to.entries(obj)){
  ///  console.log(`${index}: ${value}`)
  /// }
  ///
  /// // Output:
  /// // 0: Jane
  /// // 1: Doe
  entries: (obj) => {
    if (is.array(obj)) {
      return obj.entries()
    }

    let index = 0
    // In ES6, you can use strings or symbols as property keys,
    // Reflect.ownKeys() retrieves both. But the support it is
    // extremly low at the time of writing this.
    let keys = to.keys(obj)

    return {
      [Symbol.iterator]() {
        return this
      },
      next() {
        if (index < keys.length) {
          let key = keys[index]
          index++
          return {
            value: [ key, obj[key] ]
          }
        }

        return {
          done: true
        }
      }
    }
  },

  /// @name object entries
  /// @description
  /// This function takes advatage of es6 object deconstructing abilities.
  /// It dramatically simplifies looping over objects, when you know the keys
  /// you're looping over.
  ///
  /// @arg {object} obj - The object you're looping over
  /// @arg {string} key_name ['key'] - The name of the current key in the object loop
  /// @arg {string} index_name ['i'] - The name of the current index in the loop
  ///
  /// @markup {js} **Example:**
  /// let example = {
  ///   foo: {
  ///     one: 'Item one',
  ///     two: 'Item two',
  ///     three: 'Item three'
  ///   }
  /// }
  ///
  /// for (let { key, one, two, three } of to.objectEntries(example)) {
  ///   // key -> 'foo'
  ///   // one -> 'Item one'
  ///   // two -> 'Item two'
  ///   // three -> 'Item three'
  /// }
  objectEntries(obj, key_name = 'key', index_name = 'i') {
    let i = 0
    let keys = to.keys(obj)
    let length = keys.length

    return {
      [Symbol.iterator]() {
        return this
      },
      next() {
        if (i < length) {
          let key = keys[i]
          i++
          return {
            value: {
              [key_name]: key,
              [index_name]: i - 1,
              ...obj[key]
            }
          }
        }

        return { done: true }
      }
    }
  },

  /// @name to.normalize
  /// @description
  /// Removes trailing/leading blank lines. Removes extra whitespace before all the lines that
  /// are passed without affecting the formatting of the passes string. Then removes
  /// all whitespace at the end of each line.
  /// @arg {string, array} content - The content you want to be normalized
  /// @arg {boolean} leading [true] - Determins if leading blank lines should be removed
  /// @arg {boolean} trailing [leading] - Determins if trailing blank lines should be removed. It defaults to `leading`.
  /// @returns {string} - The normalized string
  normalize: (content, leading = true, trailing = leading) => {
    content = to.array(content) // this allows arrays and strings to be passed

    // remove leading blank lines
    if (leading) {
      while (content.length && !!!content[0].trim().length) content.shift()
    }

    // remove trailing blank lines
    if (trailing) {
      while (content.length && !!!(content[content.length - 1].trim()).length) content.pop()
    }

    let trim_by = content.join('\n') // converts content to string to string
      // gets the extra whitespace at the beginning of the line and
      // returns a map of the spaces
      .match(/^\s*/gm)
      // sorts the spaces array from smallest to largest and then checks
      // returns the length of the first item in the array
      .sort((a, b) => a.length - b.length)[0].length

    return content
      .map((line) => line.slice(trim_by)) // remove extra whitespace from the beginning of each line
      .join('\n') // converts content to string
      .replace(/[^\S\r\n]+$/gm, '') // removes all trailing white spaces from each line
  },

  /// @name to.extend
  /// @description
  /// Extend object `b` onto `a`
  /// http://jsperf.com/deep-extend-comparison
  /// @arg {object} a - Source object.
  /// @arg {object} b - Object to extend with.
  /// @returns {object} The extended object.
  extend: (a, b) => {
    // Don't touch `null` or `undefined` objects.
    if (!a || !b) {
      return a
    }

    let k = to.keys(b) // eslint-disable-line

    for (let i = 0, l = k.length; i < l; i++) {
      if (is.plainObject(b[k[i]])) {
        a[k[i]] = is.plainObject(a[k[i]]) ? to.extend(a[k[i]], b[k[i]]) : b[k[i]]
      } else {
        a[k[i]] = b[k[i]]
      }
    }

    return a
  },

  /// @name to.clone
  /// @description
  /// This will clone argument so the passed arg doesn't change
  ///
  /// @arg {*} - The item you want to clone
  /// @returns {*} - The copied result
  clone(arg) {
    // Basis.
    if (!(arg instanceof Object)) {
      return arg
    }

    let clone

    // Filter out special objects.
    let Constructor = arg.constructor
    switch (Constructor) {
      // Implement other special objects here.
      /* eslint-disable indent */
      case RegExp:
        clone = new Constructor(arg)
        break
      case Date:
        clone = new Constructor(arg.getTime())
        break
      default:
        clone = new Constructor()
      /* eslint-enable indent */
    }

    // Clone each property.
    for (var prop in arg) { // eslint-disable-line
      clone[prop] = to.clone(arg[prop])
    }

    return clone
  },

  /// @name to.merge
  /// @description
  /// This is similar to `to.extend` except in `to.extend` the values
  /// in `a` are replaced with the values in `b`. This function will
  /// not only merge the objects together, it also merges the values of
  /// the objects together.
  ///
  /// If the value in `b` is a function **or** the value of `a` is undefined
  /// it will just set the value of `a` to be the value of `b`
  ///
  /// If the value in `a` is an array, then the value in `b` gets pushed
  /// onto the value in `a`.
  ///
  /// If the value in `a` is an object then it checks the value in `b` to
  /// see if it's an object and if it is then it calls `to.merge` again on
  /// those objects for recursion. If the value in `b` isn't an object then
  /// the value in `a` get's replaced by the value in `b`.
  ///
  /// If the value in `a` is anything else, then it converts it into an array
  /// and adds the value in `b` to it.(`[a[key], b[key]]`)
  ///
  /// @arg {object} - The object to be modified
  /// @arg {object} - The object that has the updates
  /// @arg {boolean} - If true every array will be flattend to a single dimensional array, and will remove duplicate values
  ///
  /// @markeup {js} **Example:**
  /// let a = { foo: { bar: "1", baz: ["3", "4"], qux: "one", quux: { garply: { waldo: "one" } }, waldo: "" } }
  /// let b = {
  ///   foo: {
  ///     bar: "2",
  ///     baz: ["5", "6"],
  ///     qux: ["two", "three"],
  ///     quux: { garply: { waldo: "two" } },
  ///     waldo: function(){ return this; },
  ///     garply: "item"
  ///   }
  /// }
  ///
  /// to.merge(a, b)
  ///
  /// @markup {js} **Output:**
  /// {
  ///  foo: {
  ///   bar: [ "1", "2" ], // started as a string and converted to an array
  ///   baz: [ "3", "4", "5", "6" ], // merged two arrays together
  ///   qux: [ "one", "two", "three" ], // started as a string and merged the array with the string
  ///   quux: { garply: { waldo: [ "one", "two" ] } }, // `foo.quux.garply.waldo` started as string and converted to an array
  ///   waldo: function(){ return this; }, // started as a string and changed to be a function
  ///   garply: "item" // didn't exist before so it stays as a string
  ///  }
  /// }
  merge(a, b, unique = true, flat = true) { // eslint-disable-line
    // a) Don't touch `null` or `undefined` objects.
    if (!a || !b) {
      return a
    }

    // loop over each key in the second map
    for (let k in b) {
      if (b.hasOwnProperty(k)) {
        // a) Set the value of `a` to be the value in `b` because it was either
        //    a function or it didn't exsit already in `a`
        // c) Push the value in `b` into the `a` values array
        // b) The recursive functionality happends here
        //    a) Call the merge function go further into the object
        //    b) Sets the value of `a` to be the value of `b`
        // d) Convert the a value to be an array, and add the `b` value to it
        if (is.fn(b[k]) || is.fn(a[k]) || is.undefined(a[k])) {
          a[k] = b[k]
        } else if (is.array(a[k])) {
          a[k].push(b[k])
        } else if (is.plainObject(a[k])) {
          a[k] = is.plainObject(b[k]) ? to.merge(a[k], b[k]) : b[k]
        } else {
          a[k] = [ a[k], b[k] ]
        }

        // a) is array
        if (is.array(a[k])) {
          // a) Flatten the array
          if (flat) {
            a[k] = to.flatten(a[k])
          }

          // a) Filter out duplicates
          if (unique && !is.plainObject(a[k][0])) {
            a[k] = to.unique(a[k])
          }
        }
      }
    }

    return a
  },

  /// @name to.object
  /// @description Converts a json object to a plain object
  /// @arg {json} - The json to parse
  /// @returns {object}
  object: (arg) => {
    if (is.array(arg)) {
      let result = {}
      for (let item of arg) result[item[0]] = item[1]
      return result
    }

    return JSON.parse(arg)
  },

  /// @name to.json
  /// @description Converts an object to a json string
  /// @arg {object} - The object to convert
  /// @arg {number} - The spacing to use
  /// @returns {json}
  json: (arg, spacing = 2) => is.object(arg) && JSON.stringify(arg, null, spacing),

  /// @name to.array
  /// @description
  /// Converts `...args` to array
  /// It converts multiple arrays into a single array
  /// @arg {array, string, object, number} - The item you want to be converted to array
  /// @returns {array}
  array: (arg, glue = '\n') => {
    if (is.array(arg)) {
      return arg
    } else if (is.arguments(arg)) {
      return arraySlice(arg)
    } else if (is.string(arg)) {
      return arg.split(glue)
    } else if (is.plainObject(arg) || is.number(arg)) {
      return [ arg ]
    }

    return []
  },

  /// @name to.flatten
  /// @description
  /// Flattens an array, and arrays inside of it into a single array
  /// @arg {array}
  /// @returnes {array} - single dimensional
  flatten: (arg) => is.array(arg) ? [].concat(...arg.map(to.flatten)) : arg,

  /// @name to.unique
  /// @description
  /// Removes duplicate values from an array
  /// @arg {array}
  /// @returns {array} - without duplicates
  unique(arg) {
    if (!is.array(arg)) {
      return arg
    }

    let obj = {}
    let result = []
    /* eslint-disable guard-for-in */
    for (let i in arg) obj[arg[i]] = arg[i]

    for (let i in obj) result.push(obj[i])
    /* eslint-enable guard-for-in */

    return result
  },

  /// @name to.sort
  /// @description
  /// Sorts an array or object based off your callback function. If one is provided.
  /// @arg {array, object}
  /// @returns {array, object} - The sorted version
  sort(arg, callback) {
    let runSort = (obj) => is.fn(callback) ? obj.sort.apply(null, callback) : obj.sort()
    let result
    if (is.plainObject(arg)) {
      let sorted = {}
      let keys = runSort(to.keys(arg))

      for (let i = 0, l = keys.length; i < l; i++) {
        sorted[keys[i]] = arg[keys[i]]
      }

      result = sorted
    } else if (is.array(arg)) {
      result = runSort(callback)
    }
    return result
  },

  map(arg, callback) {
    if (is.array(arg)) {
      return arg.map.apply(null, callback)
    }

    let result = {}

    for (let [ key, value ] of to.entries(arg)) {
      let cb_result = callback(value, key)
      if (is.truthy(cb_result) && !is.empty(cb_result) && is.plainObject(cb_result)) {
        to.extend(result, cb_result)
      }
    }

    return result
  },

  filter(arg, callback) {
    if (is.array(arg)) {
      return arg.filter.apply(null, callback)
    }

    let result = {}

    for (let [ key, value ] of to.entries(arg)) {
      if (is.truthy(callback(value, key, arg))) {
        to.extend(result, { key: value })
      }
    }

    return result
  },

  /// @name to.number
  /// @description
  /// Converts `arg` to number
  /// @arg {number, array, object, string, boolean}
  /// @returns {number}
  number: (arg) => {
    if (is.number(arg)) {
      return arg
    } else if (is.array(arg)) {
      return arg.length
    } else if (is.plainObject(arg)) {
      return to.keys(arg).length
    }

    return ~~arg // eslint-disable-line
  }
}

export default to
