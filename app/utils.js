// I would like to remove the need for a third party lib for deferreds and create a simple one.
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

import path from "path";
export {path};

import glob from "glob";
export {glob};

import Deferred from "deferred-js";
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

export {Deferred};

import * as fs from "fs-extra";
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
export {fs};


/// @name extend
/// @description
/// Extend object `b` onto `a`
/// http://jsperf.com/deep-extend-comparison
/// @arg {object} a - Source object.
/// @arg {object} b - Object to extend with.
/// @returns {object} The extended object.
export function extend(a, b){
 // Don't touch `null` or `undefined` objects.
 if(!a || !b){
  return a;
 }

 for(let i = 0, keys = Object.getOwnPropertyNames(b), l = keys.length; i < l; i++){
  let k = keys[i];
  a[k] = is.object(b[k]) && is.object(a[k]) ? extend(a[k], b[k]) : b[k]
 }

 return a;
}

/// @name normalize
/// @description
/// Removes extra whitespace before all the lines that are passed
/// Removes all whitespace at the end of each line
/// Removes trailing blank lines
/// @arg {array, string} content - The array of lines that will be normalized
/// @returns {string} - The normalized string
export function normalize(content){
 content = to.array(content); // this allows arrays and strings to be passed

 // remove trailing blank lines
 for(let i = content.length; i-- && content[i].length === 0; content.pop());

 return content
         .map(line => line.slice(
          content.join("\n") // converts content to string to string
           .match(/^\s*/gm) // gets the extra whitespace at the begining of the line and returns a map of the spaces
           .sort((a, b) => a.length - b.length)[0].length // sorts the spaces array from smallest to largest and then checks returns the length of the first item in the array
         )) // remove extra whitespace from the begining of each line
         .join("\n").replace(/[^\S\r\n]+$/gm, ""); // convert to string and remove all trailing white spaces
};



const to_string = arg => Object.prototype.toString.call(arg),
      array_slice = arg => Array.prototype.slice.call(arg);

export const to = {
 // @name to.string
 // @description
 // Converts an object, array, number, or boolean to a string
 // @arg {string, object, array, number, boolean}
 // @returns {string}
 string: (arg, glue = "\n") => is.string(arg) ? arg : is.object(arg) ? Object.prototype.toString.call(arg) : is.array(arg) ? arg.join(glue) : is.number(arg) || is.boolean(arg) ? arg.toString() : "'" + arg + "'",

 // @name to.keys
 // @description
 // Converts an object to an array of it's key names
 // @arg {object}
 // @returns {array}
 keys: (arg) => is.object(arg) && Object.getOwnPropertyNames(arg),

 // @name to.json
 // @description
 // Converts an object to a json string
 // @arg {object}
 // @returns {json object}
 json: (arg, spacing = 2) => is.object(arg) && JSON.stringify(arg, null, spacing),

 object: (arg) => is.json(arg),

 // @name to.array
 // @description
 // Converts `...args` to array
 // It converts multiple arrays into a single array
 // @arg {array, string, object, number} - The item you want to be converted to array
 // @returns {array}
 // array: (arg, glue = "\n") => is.array(arg) ? arg : is.string(arg) ? arg.split(glue) : is.object(arg) || is.number(arg) ? [arg] : [],

 array: function(arg, ...args){
  let glue = args.length > 0 && is.regexp(args[args.length - 1]) ? args.pop() : "\n",
      to_array = arg => is.array(arg) ? arg : is.string(arg) ? arg.split(glue) : is.object(arg) || is.number(arg) ? [arg] : [],
      result = to_array(arg);

  if(args.length > 0){
   for(let i = 0, l = args.length; i < l; i++){
    let arg = args[i];
    result = result.concat();
   }
  }

  return result;
 },

 // @name to.sort
 // @description
 // Sorts an array or object based off your callback function. If one is provided.
 // @arg {array, object}
 // @returns {array, object} - The sorted version
 sort: (arg, callback) => {
  let run_sort = (obj) => is.function(callback) ? obj.sort.apply(null, callback) : obj.sort(),
      result;
  if(is.object(arg)){
   let sorted = {},
       keys = run_sort(to.keys(arg));

   for(let i = 0, l = keys.length; i < l; i++){
    sorted[keys[i]] = arg[keys[i]];
   }

   result = sorted;
  }else if(is.array(arg)){
   result = run_sort(callback);
  }
  return result;
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
 number: (arg) => is.number(arg) ? arg : is.array(arg) ? arg.length : is.object(arg) ? to.keys(arg).length : ~~arg,

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

export const is = {
  // placeholder for the interfaces
  not: {},
  all: {},
  any: {},

  // @description is a given arg Arguments?
  // fallback check is for IE
  argslist: (arg) => !is.null(arg) && (to_string.call(arg) === "[object Arguments]" || (typeof arg === "object" && "callee" in arg)),


  // @description is a given arg function?
  // @arg {*} arg - The item to check
  // @returns {boolean} - The result of the test
  function: arg => to_string(arg) === "[object Function]" || typeof arg === "function",

  // @description is a given arg Array?
  // @arg {*} arg - The item to check
  // @returns {boolean} - The result of the test
  array: arg => to_string(arg) === "[object Array]",

  // @description is a given arg Boolean?
  // @arg {*} arg - The item to check
  // @returns {boolean} - The result of the test
  boolean: arg => arg === true || arg === false || to_string(arg) === "[object Boolean]",

  // @description is a given arg object?
  // @arg {*} arg - The item to check
  // @returns {boolean} - The result of the test
  // object: arg => to_string(arg) === "[object Object]",
  object: arg => typeof arg === "object" && !!arg && arg !== null,

  // is given value a pure JSON object?
  json: (arg) => to_string(arg) === "[object Object]",

  // @description is a given arg empty? Objects, arrays, strings
  // @arg {object, array, string} arg - What you want to check to see if it's empty
  // @returns {boolean} - determins if the item you passes was empty or not
  empty: (arg) => {
   var type = typeof arg;
   if(is.falsy(arg)){
    return true;
   }
   else if(type === "function" || type === "object" && !!arg){
    let num = Object.getOwnPropertyNames(arg).length;
    return (num === 0 || (num === 1 && is.array(arg)) || (num === 2 && is.argslist(arg))) ? true : false;
   }
   else{
    return arg === "";
   }
  },

  // @description is a given arg String?
  // @arg {*} arg - The item to check
  // @returns {boolean} - The result of the test
  string: arg => to_string(arg) === "[object String]",

  // @description is a given arg undefined?
  // @arg {*} arg - The item to check
  // @returns {boolean}
  undefined: arg => arg === void 0,

  // @description is a given string include parameter substring?
  // @arg {string} str - string to match against
  // @arg {string} substr - string to look for in `str`
  // @todo {1} update this to work with arrays
  // @todo {1} change name to be `index` because it still makes sense and it's shorter
  // @returns {number, boolean}
  included: (str, substr) => !is.empty(str) && !is.empty(substr) ? str.indexOf(substr) > -1 ? str.indexOf(substr) : false : false,
  // included: (str, substr) => is.truthy(str) && is.truthy(substr) && !is.empty(str) && !is.empty(substr) ? str.indexOf(substr) > -1 ? str.indexOf(substr) : false : false,

  // @description is a given arg false
  // @arg {*} arg - arg to check if it is false
  // @returns {boolean}
  false: arg => arg === false,

  // @description is a given arg truthy?
  // @arg {*} arg
  // @returns {boolean}
  truthy: arg => arg !== null && arg !== undefined && arg !== false && !(arg !== arg) && arg !== "" && arg !== 0,

  // @description is given arg falsy?
  // @arg {*} arg
  // @returns {boolean}
  falsy: arg => !is.truthy(arg),

  // NaN is number :) Also it is the only arg which does not equal itself
  nan: (arg) => arg !== arg,

  // @description is given arg a number?
  // @arg {*} arg
  // @returns {boolean}
  number: (arg) => is.not.nan(arg) && to_string(arg) === "[object Number]",

  // is a given number within minimum and maximum parameters?
  between: (arg, min = 0, max = Infinity) => is.all.number(arg, min, max) && arg > min && arg < max,

  // @description is a given number positive?
  // @arg {*} arg
  // @returns {boolean}
  positive: (arg) => is.number(arg) && arg > 0,

  // @description is a given number negative?
  // @arg {*} arg
  // @returns {boolean}
  negative: (arg) => is.number(arg) && arg < 0,

  // @description is a given number above minimum parameter?
  // @arg {*} arg
  // @returns {boolean}
  above: (arg, min = -1) => is.all.number(arg, min) && arg > min,

  // @description is a given number above maximum parameter?
  // @arg {*} arg
  // @returns {boolean}
  under: (arg, max = 100) => is.all.number(arg, max) && arg < max,

  // @description is a given arg null?
  // @arg {*} arg - the item you want to check and see if it's `null`
  // @returns {boolean}
  null: (arg) => arg === null,

  promise: arg => arg && is.function(arg.then),

  stream: arg => arg && is.function(arg.pipe)
};

// included method does not support `all` and `any` interfaces
is.included.api = ["not"];

// within method does not support `all` and `any` interfaces
is.between.api = ["not"];

// `above` method does not support `all` and `any` interfaces
is.above.api = ['not'];

// least method does not support `all` and `any` interfaces
is.under.api = ['not'];

const not = (func) => () => !func.apply(null, array_slice(arguments)),
      all = (func) => {
       return () => {
        let parameters = array_slice(arguments),
            length = parameters.length;

        // support array
        if(length === 1 && is.array(parameters[0])){
         parameters = parameters[0];
         length = parameters.length;
        }

        for(let i = 0, l = length; i < length; i++){
         if(!func.call(null, parameters[i])){
          return false;
         }
        }

        return true;
       };
      },
      any = (func) => {
       return function(){
        let parameters = array_slice(arguments),
            length = parameters.length;

        // support array
        if(length === 1 && is.array(parameters[0])){
         parameters = parameters[0];
         length = parameters.length;
        }

        for(var i = 0, l = length; i < l; i++){
         if(func.call(null, parameters[i])){
          return true;
         }
        }
        return false;
       };
      },
      setInterfaces = () => {
      var options = is;
      for(var option in options){
       if(hasOwnProperty.call(options, option) && is.function(options[option])){
        var interfaces = options[option].api || ["not", "all", "any"];
        for (var i = 0; i < interfaces.length; i++){
         if(interfaces[i] === "not"){
          is.not[option] = not(is[option]);
         }
         if(interfaces[i] === "all"){
          is.all[option] = all(is[option]);
         }
         if(interfaces[i] === "any"){
          is.any[option] = any(is[option]);
         }
        }
       }
      }
     }();