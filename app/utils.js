export function defer(){
  let resolve, reject;

  let promise = new Promise((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;
  });

  return {
    promise,
    resolve,
    reject,
  };
}



const toString = arg => Object.prototype.toString.call(arg);

export const is = {
  // @description is a given value function?
  // @arg {*} value - The item to check
  // @returns {boolean} - The result of the test
  function: arg => toString(arg) === "[object Function]" || typeof arg === "function",

  // @description is a given value Array?
  // @arg {*} value - The item to check
  // @returns {boolean} - The result of the test
  array: arg => toString(arg) === "[object Array]",

  // @description is a given value Boolean?
  // @arg {*} value - The item to check
  // @returns {boolean} - The result of the test
  boolean: arg => arg === true || arg === false || toString(arg) === "[object Boolean]",

  // @description is a given value object?
  // @arg {*} value - The item to check
  // @returns {boolean} - The result of the test
  object: arg => toString(arg) === "[object Object]",

  // @description is a given value empty? Objects, arrays, strings
  // @arg {object, array, string} value - What you want to check to see if it's empty
  // @returns {boolean} - determins if the item you passes was empty or not
  empty: arg => is.object(arg) ? Object.getOwnPropertyNames(arg).length === 0 : is.array(arg) ? arg.length > 0 : arg === "",

  // @description is a given value String?
  // @arg {*} value - The item to check
  // @returns {boolean} - The result of the test
  string: arg => toString(arg) === "[object String]",

  // @description is a given value undefined?
  // @arg {*} value - The item to check
  // @returns {boolean}
  undefined: arg => arg === void 0,

  // @description is a given string include parameter substring?
  // @arg {string} str - string to match against
  // @arg {string} substr - string to look for in `str`
  // @returns {number, boolean}
  included: (str, substr) => !is.empty(str) && !is.empty(substr) ? str.indexOf(substr) > -1 ? str.indexOf(substr) : false : false,

  // @description is a given value false
  // @arg {*} value - value to check if it is false
  // @returns {boolean}
  false: arg => arg === false,

  // @description is a given value truthy?
  // @arg {*} value - the item you want to check and see if it's truthy
  // @returns {boolean}
  truthy: arg => arg !== null && arg !== undefined && arg !== false && !(arg !== arg) && arg !== "" && arg !== 0,

  // @description is given value falsy?
  // @arg {*} value - the item you want to check and see if it's falsy
  // @returns {boolean}
  falsy: arg => !is.truthy(arg),

  promise: arg => arg && is.function(arg.then),
  stream: arg => arg && is.function(arg.pipe)
};