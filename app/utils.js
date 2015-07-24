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

const to = {
 // @name to.string
 // @description
 // Converts an object, array, number, or boolean to a string
 // @arg {string, object, array, number, boolean}
 // @returns {string}
 string: (arg, glue = "\n") => is.string(arg) ? arg : is.object(arg) ? Object.prototype.toString.call(arg) : is.array(arg) ? arg.join(glue) : is.number(arg) || is.boolean(arg) ? arg.toString() : "'" + arg + "'",

 // @name to.array
 // @description
 // Converts `...args` to array
 // It converts multiple arrays into a single array
 // @arg {array, string, object, number} - The item you want to be converted to array
 // @returns {array}
 array: (...args) => {
  let result = [],
      glue = is.regexp(args[args.length - 1]) ? args.pop() : "\n";

  for(let arg of args){
   result.concat(to.array(arg));
  }

  return is.array(arg) ? arg : is.string(arg) ? arg.split(glue) : is.object(arg) || is.number(arg) ? [arg] : [];
 },

 // @name to.merge
 // @description
 // This merges the last argument in the list with the 2nd to last argument.
 //
 // If the `name` **doesn't** exist then it adds it.
 //
 // If the `name` **does** exist
 //  - If it **isn't** an `Array` then it converts the current value to an
 //    array and adds the new item to that array.
 //  - If it's already an array then it pushes `to_merge` onto it.
 //
 // @arg {object} - The object that you want to merge onto
 // @arg {...argsList, string} keys - Name of the annotation to merge
 // @args {string} name - the 2nd to last argument in the `...argsList`
 // @arg {*} to_merge - The item to merge
 // @returns {object} - The updated `obj`
 merge: (obj, ...args/*, name, to_merge */) => {
  let current = obj,
      to_merge = args.pop(),
      name = args.pop();



  if(args.length > 0){
   for(let i = 0, l = args.length; i < l; i++){
    let arg = current[args[i]];
    if(is.undefined(current[args[i]])){
     current[args[i]] = {};
    }
   }
  }

  // a) the current item being merged is already defined in the base
  // b) define the target
  if(!is.undefined(current[name])){
   // a) convert the target to an array
   // b) add item to the current target array
   if(!is.array(current[name])){
    current[name] = [current[name], to_merge];
   }else{
    current[name].push(to_merge);
   }
  }else{
   current[name] = to_merge;
  }

  return current;
 },

 // @name to.regex
 // @description
 // Converts `...args` to regex
 // @returns {string}
 //
 // @markup {js}
 // new RegExp(":((" + to.regex(")|(", "link", "visited", "hover") + "))", "gi");
 regex: (glue, ...args) => to.array(args).join(glue),

 // @name to.boolean
 // @description
 // Converts `arg` to boolean
 // @arg {boolean, array, object, string, number}
 // @returns {boolean}
 boolean: (arg) => is.boolean(arg) ? arg : is.array(arg) ? !!arg.length : is.object(arg) ? is.empty(arg) : is.number(arg) ? arg > 0 ? !!arg : !!0 : !!arg,

 // @name to.number
 // @description
 // Converts `arg` to number
 // @arg {number, array, object, string, boolean}
 // @returns {number}
 number: (arg) => is.number(arg) ? arg : is.array(arg) ? arg.length : is.object(arg) ? Object.getOwnPropertyNames(arg).length : ~~arg,

 // @name to.abs
 // @description
 // Converts `arg` to a positive number
 // @arg {number, array, object, string, boolean}
 // @returns {number}
 abs: (arg) => Math.abs(to.number(arg)),

 // @name to.neg
 // @description
 // Converts `arg` to a negative number
 // @arg {number, array, object, string, boolean}
 // @returns {number}
 neg: (arg) => ~to.abs(arg)
};

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

export {Deferred, fs, path, glob, is, to, Array};