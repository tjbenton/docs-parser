/* eslint-disable no-bitwise, babel/no-await-in-loop */
'use strict'

export default function async_array(array) {
  return new AsyncArray(array)
}


class AsyncArray {
  constructor(array) {
    this.array = to_object(array)
  }

  /// @description
  /// Iterate through an array of values raising a callback for each in parallel.
  ///
  /// @arg {function} callback - The function to be applied to each value.
  /// @arg {any} receiver - The `this` value in the callback.
  async for_each(callback, receiver) {
    await promiseAll(this.array, callback, receiver)
  }

  /// @description
  /// Iterate through an array of values raising a callback for each.
  ///
  /// @arg {function} callback - The function to be applied to each value.
  /// @arg {any} receiver - The `this` value in the callback.
  async for_each_stepped(callback, receiver) {
    for (let i = 0; i < this.array.length; i++) {
      if (i in this.array) {
        await call(callback, receiver, this.array[i], i, this.array)
      }
    }
  }

  /// @description
  /// Uses a callback to sequentially map an array of values in parallel.
  ///
  /// @arg {array} array The set of values to map over.
  /// @arg {function} callback - The function to be applied to each value.
  /// @arg {any} receiver - The `this` value in the callback.
  /// @return {array} - The mapped array.
  async map(callback, receiver) {
    return await promiseAll(this.array, callback, receiver)
  }

  /// @description
  /// Uses a callback to sequentially map an array of values.
  ///
  /// @arg {array} array - The set of values to map over.
  /// @arg {function} callback - The function to be applied to each value.
  /// @arg {any} receiver - The `this` value in the callback.
  /// @return {array} - The mapped array.
  async map_stepped(callback, receiver) {
    let result = []

    for (let i = 0; i < this.array.length; i++) {
      if (i in this.array) {
        result.push(await call(callback, receiver, this.array[i], i, this.array))
      }
    }

    return result
  }

  /// @description
  /// Uses a callback to sequentially filter an array of values in parallel.
  ///
  /// @arg {function} callback - The function to filter the values.
  /// @arg {any} receiver - The `this` value in the callback.
  /// @return {array} - The filtered array.
  async filter(callback, receiver) {
    const results = await promiseAll(this.array, callback, receiver)
    return _filter(this.array, (obj, i) => results[i])
  }

  /// @description
  /// Uses a callback to sequentially filter an array of values.
  ///
  /// @arg {function} callback - The function to filter the values.
  /// @arg {any} receiver - The `this` value in the callback.
  /// @return {array} - The filtered array.
  async filter_stepped(callback, receiver) {
    const result = []

    for (let i = 0; i < this.array.length; i++) {
      if (i in this.array) {
        const item = this.array[i]
        if (await call(callback, receiver, item, i, this.array)) { // eslint-disable-line
          result[result.length] = item
        }
      }
    }

    return result
  }

  /// @description
  /// Uses a callback to reduce a set of values.
  ///
  /// @arg {function} callback - The function to be applied to each value.
  /// @arg {any} receiver - The `this` value in the callback.
  /// @return {any} - The accumulated value.
  async reduce(callback, initial) {
    const obj = this.array
    const len = ~~this.array.length
    let accum = initial
    let start = 0

    if (arguments.length < 3) {
      for (; start < len; start++) {
        if (start in obj) {
          accum = obj[start++]
          break
        }
      }
    }

    for (let i = start; i < len; i++) {
      if (i in obj) {
        accum = await callback(accum, obj[i], i, this.array)
      }
    }

    return accum
  }

  /// @description
  /// Returns true the first time a callback returns a truthy value against a set
  /// of values, otherwise returns false.
  ///
  /// @arg {function} callback - The function to test each value.
  /// @arg {any} receiver - The `this` value in the callback.
  /// @return Boolean
  async some(callback, receiver) {
    for (let i = 0; i < this.array.length; i++) {
      if (i in this.array && (await call(callback, receiver, this.array[i], i, this.array))) {
        return true
      }
    }

    return false
  }

  /// @description
  /// Returns false the first time a callback returns a falsey value against a set
  /// of values, otherwise returns true.
  ///
  /// @arg {function} callback - The function to test each value.
  /// @arg {any} receiver - The `this` value in the callback.
  /// @return Boolean
  async every(callback, receiver) {
    for (let i = 0; i < this.array.length; i++) {
      if (i in this.array && !(await call(callback, receiver, this.array[i], i, this.array))) {
        return false
      }
    }

    return true
  }
}

function promiseAll(array, callback, receiver) {
  const obj = to_object(array)
  const len = ~~obj.length
  const promises = []

  for (let i = 0; i < len; i++) {
    if (i in obj) {
      promises[promises.length] = call(callback, receiver, obj[i], i, array)
    }
  }

  return Promise.all(promises)
}

const callbind = Function.prototype.bind.bind(Function.prototype.call)
const call = callbind(Function.prototype.call)
const _filter = callbind(Array.prototype.filter)

function to_object(value) {
  if (value == null) {
    throw new TypeError(`Can't convert ${value} to obj`)
  }
  return Object(value)
}
