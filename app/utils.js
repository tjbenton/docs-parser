function defer(){
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


import * as fs from "fs-extra";
import path from "path";
import Deferred from "deferred-js";
import glob from "glob";


// extends the functionality of deffered to accept an array of deffereds
Deferred.when.all = function(deferreds){
 let deferred = new Deferred();
 Deferred.when.apply(null, deferreds)
  .then(function(){
   deferred.resolve(Array.prototype.slice.call(arguments))
  }, function(){
   deferred.fail(Array.prototype.slice.call(arguments))
  });
 return deferred;
};

// creates an empty file temp file in the `.tmp/`
fs.fake_copy = (source, target, callback) => {
 var cbCalled = false,
     source = path.parse(source),
     target = path.parse(target);

 // creates the directory path if it doesn't exist
 fs.mkdirp(path.resolve(source.dir, path.relative(source.dir, target.dir)), () => {
  fs.writeFile(path.join(target.dir, target.base), "", () => callback && callback());
 });
};

const to_string = arg => Object.prototype.toString.call(arg);

const is = {
  // @description is a given value function?
  // @arg {*} value - The item to check
  // @returns {boolean} - The result of the test
  function: arg => to_string(arg) === "[object Function]" || typeof arg === "function",

  // @description is a given value Array?
  // @arg {*} value - The item to check
  // @returns {boolean} - The result of the test
  array: arg => to_string(arg) === "[object Array]",

  // @description is a given value Boolean?
  // @arg {*} value - The item to check
  // @returns {boolean} - The result of the test
  boolean: arg => arg === true || arg === false || to_string(arg) === "[object Boolean]",

  // @description is a given value object?
  // @arg {*} value - The item to check
  // @returns {boolean} - The result of the test
  object: arg => to_string(arg) === "[object Object]",

  // @description is a given value empty? Objects, arrays, strings
  // @arg {object, array, string} value - What you want to check to see if it's empty
  // @returns {boolean} - determins if the item you passes was empty or not
  empty: arg => is.object(arg) ? Object.getOwnPropertyNames(arg).length === 0 : is.array(arg) ? arg.length > 0 : arg === "",

  // @description is a given value String?
  // @arg {*} value - The item to check
  // @returns {boolean} - The result of the test
  string: arg => to_string(arg) === "[object String]",

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

Array.prototype.contains = function(i){
 return this.indexOf(i) >= 0;
};

export {Deferred, fs, path, glob, to_string, is, Array};