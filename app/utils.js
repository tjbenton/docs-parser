// import and export `path` so all general
// utils can be imported from this file
import path from "path";
export {path};

// Stores the project directory to use later
let info = {};
info.root = process.cwd(); // gets the root directory

info.dir = info.root.split(path.sep); // splits the project dir by the system specific delimiter
info.dir = info.dir[info.dir.length - 1]; // gets the working directory

info.temp = {};
info.temp.folder = path.join(info.root, ".tmp");
info.temp.file = path.join(info.temp.folder, "data.json");
export {info};

// @name denodeify
// @description
// Takes functions that takes callbacks
// and converts it into a promise.
// @returns {promise}
// @markup {js}
// import fs from "fs";
// fs.readFile = denodeify(fs.readFile);
export function denodeify(func){
 return function(...args){
  return new Promise((resolve, reject) => {
   func(...args, (err, ...args) => err ? reject(err) : resolve(...args));
  });
 };
};


// File System
import * as fs from "fs-extra";
// @name fs.fake_copy
// @description
// Creates an empty file temp file in the `.tmp/`. This is so that I can
// check to see if the source file has been updated.
fs.fake_copy = (source, target, callback) => {
 var cbCalled = false,
     source = path.parse(source),
     target = path.parse(target);

 // creates the directory path if it doesn't exist
 fs.mkdirp(path.resolve(source.dir, path.relative(source.dir, target.dir)), () => {
  fs.writeFile(path.join(target.dir, target.base), "", () => callback && callback());
 });
};

// The functions below are converted into promises
fs.readJson = denodeify(fs.readJson);
fs.outputJson = denodeify(fs.outputJson);
fs.stat = denodeify(fs.stat);
fs.readFile = denodeify(fs.readFile);
export {fs};

// can't use `import` from es6 because it
// returns an error saying "glob" is read only
let glob = denodeify(require("glob"));
export {glob};

const to_string = arg => Object.prototype.toString.call(arg),
      array_slice = arg => Array.prototype.slice.call(arg);

import markdown from "marked";

export let to = {
 /// @name to.log
 /// @description
 /// Shortcut for `console.log`
 log: console.log.bind(console),

 /// @name to.markdown
 /// @description
 /// Helper function to convert markdown text to html
 /// For more details on how to use marked [see](https://www.npmjs.com/package/marked)
 /// @returns {string} of `html`
 markdown,

 // @name to.string
 // @description
 // Converts an object, array, number, or boolean to a string
 // @arg {string, object, array, number, boolean}
 // @returns {string}
 string: (arg, glue = "\n") => is.string(arg) ? arg : is.buffer(arg) ? arg + "" : is.object(arg) ? to_string(arg) : is.array(arg) ? arg.join(glue) : is.number(arg) || is.boolean(arg) ? arg.toString() : arg + "",

 // The ` + ""` converts the file from a buffer to a string
 //
 // The `replace` fixes a extremely stupid issue with strings, that is caused by shitty microsoft computers.
 // It removes`\r` and replaces it with `\n` from the end of the line. If this isn't here then when `match`
 // runs it will return 1 more item in the matched array than it should(in the normalize function)
 // http://stackoverflow.com/questions/20023625/javascript-replace-not-replacing-text-containing-literal-r-n-strings
 normal_string: (str) => (is.string(str) ? str : to.string(str)).replace(/(?:\\[rn]+)+/g, "\n"),

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

 /// @name to.normalize
 /// @description
 /// Removes trailing blank lines. Removes extra whitespace before all the lines that
 /// are passed without affecting the formatting of the passes string. Then removes
 /// all whitespace at the end of each line.
 /// @arg {string, array} content - The content you want to be normalized
 /// @returns {string} - The normalized string
 normalize: (content) => {
  content = to.array(content); // this allows arrays and strings to be passed

  // remove trailing blank lines
  for(let i = content.length; i-- && content[i].length === 0;){
   content.pop();
  };

  return content
          .map(line => line.slice(
           content.join("\n") // converts content to string to string
            .match(/^\s*/gm) // gets the extra whitespace at the beginning of the line and returns a map of the spaces
            .sort((a, b) => a.length - b.length)[0].length // sorts the spaces array from smallest to largest and then checks returns the length of the first item in the array
          )) // remove extra whitespace from the beginning of each line
          .join("\n").replace(/[^\S\r\n]+$/gm, ""); // convert to string and remove all trailing white spaces
 },

 /// @name extend
 /// @description
 /// Extend object `b` onto `a`
 /// http://jsperf.com/deep-extend-comparison
 /// @arg {object} a - Source object.
 /// @arg {object} b - Object to extend with.
 /// @returns {object} The extended object.
 extend: (a, b) => {
  // Don't touch `null` or `undefined` objects.
  if(!a || !b){
   return a;
  }

  for(let k in b){
   a[k] = is.object(b[k]) ? is.object(a[k]) ? to.extend(a[k], b[k]) : b[k] : b[k];
  }

  return a;
 },

 /// @name to.clone
 /// @description
 /// This will clone argument so the passed arg doesn't change
 ///
 /// @arg {*} - The item you want to clone
 /// @returns {*} - The copied result
 clone: (arg) => is.object(arg) ? to.extend({}, arg) : is.array(arg) ? [].concat(arg) : [].concat(arg)[0],

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
 /// let a = { foo: { bar: "1", baz: ["3", "4"], qux: "one", quux: { garply: { waldo: "one" } }, waldo: "" } },
 ///     b = { foo: { bar: "2", baz: ["5", "6"], qux: ["two", "three"], quux: { garply: { waldo: "two" } }, waldo: function(){ return this; }, garply: "item" } };
 ///
 /// to.merge(a, b);
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
 merge: (a, b, unique = true) => {
  // a) Don't touch `null` or `undefined` objects.
  if(!a || !b){
   return a;
  }

  // loop over each key in the second map
  for(let k in b){
   // a) Set the value of `a` to be the value in `b` because it was either
   //    a function or it didn't exsit already in `a`
   // c) Push the value in `b` into the `a` values array
   // b) The recursive functionality happends here
   //    a) Call the merge function go further into the object
   //    b) Sets the value of `a` to be the value of `b`
   // d) Convert the a value to be an array, and add the `b` value to it
   if(is.function(b[k]) || is.function(a[k]) || is.undefined(a[k])){
    a[k] = b[k];
   }
   else if(is.array(a[k])){
    a[k].push(b[k]);
   }
   else if(is.object(a[k])){
    a[k] = is.object(b[k]) ? to.merge(a[k], b[k]) : b[k];
   }
   else{
    a[k] = [a[k], b[k]];
   }

   // a) Flatten the array, and filter out duplicates
   if(unique && is.array(a[k])){
    a[k] = to.array.unique([].concat.apply([], a[k]));
   }
  }

  return a;
 },

 object: (arg) => is.json(arg),

 // @name to.array
 // @description
 // Converts `...args` to array
 // It converts multiple arrays into a single array
 // @arg {array, string, object, number} - The item you want to be converted to array
 // @returns {array}
 // array: (arg, glue = "\n") => is.array(arg) ? arg : is.string(arg) ? arg.split(glue) : is.object(arg) || is.number(arg) ? [arg] : [],
 array: (arg, ...args) => {
  let glue = args.length > 0 && is.regexp(args[args.length - 1]) ? args.pop() : "\n",
      to_array = arg => is.array(arg) ? arg : is.argument(arg) ? array_slice(arg) : is.string(arg) ? arg.split(glue) : is.object(arg) || is.number(arg) ? [arg] : [],
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

// @name to.array.flat
// @description
// Flattens an array, and arrays inside of it into a single array
// @arg {array}
// @returnes {array}
to.array.flat = (arg) => [].concat.apply([], to.array(arg));

// @name to.array.unique
// @description
// Removes duplicate values from an array
// @arg {array}
// @returns {array}
to.array.unique = (arg) => {
 let o = {},
     r = [];
 for(let i in arg){
  o[arg[i]] = arg[i];
 }
 for(let i in o){
  r.push(o[i]);
 }
 return r;
};

// to.array.flat.unique = (arg) => to.array.unique(to.array.flat(arg));

// var seen = new Set();
//   return a.filter((x) => !seen.has(x) && seen.add(x))
export let is = {
 // placeholder for the interfaces
 not: {},
 all: {},
 any: {},

 // @description is a given arg Arguments?
 // fallback check is for IE
 // @arg {*} arg - The item to check
 // @returns {boolean} - The result of the test
 argument: (arg) => !is.null(arg) && (to_string.call(arg) === "[object Arguments]" || (typeof arg === "object" && "callee" in arg)),

 // @description is a given arg regex expression?
 // @arg {*} arg - The item to check
 // @returns {boolean} - The result of the test
 regex: (value) => to_string.call(value) === "[object RegExp]",

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
 object: arg => typeof arg === "object" && !!arg && arg !== null,

 // @description is given value a pure JSON object?
 // @arg {*} arg - The item to check
 // @returns {boolean} - The result of the test
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
   return (num === 0 || (num === 1 && is.array(arg)) || (num === 2 && is.argument(arg))) ? true : false;
  }
  else{
   return arg === "";
  }
 },

 // @description is a given value existy?
 // @arg {*} arg - The item to check
 // @returns {boolean} - The result of the test
 existy: (arg) => arg !== null && arg !== undefined,

 // @description is a given arg String?
 // @arg {*} arg - The item to check
 // @returns {boolean} - The result of the test
 string: arg => to_string(arg) === "[object String]",

 // @description is a given arg undefined?
 // @arg {*} arg - The item to check
 // @returns {boolean}
 undefined: arg => arg === void 0,

 // @description is a given string include parameter substring?
 // @arg {string, array} a - string to match against
 // @arg {string, array} b - string to look for in `str`
 // @todo {1} update this to work with arrays
 // @todo {1} change name to be `index` because it still makes sense and it's shorter
 // @returns {number, boolean}
 included: (a, b) => !is.empty(a) && !is.empty(b) && a.indexOf(b) > -1 ? a.indexOf(b) : false,


 // @description is the `value` in `obj`?
 // @arg {array, string, object} obj - the item to check against
 // @arg {*} value - the value to look for in the `obj`
 // @returns {boolean}
 in: (obj, value) => is.included(is.object(obj) ? to.keys(obj) : obj, value) !== false,

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
 between: (arg, min = 0, max = Infinity) => is.all.number(arg, min, max) && (arg >= min && arg <= max),

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

 // @description is a given arg a promise?
 // @arg {*} arg - the item you want to check and see if it's a `Promise`
 // @returns {boolean}
 promise: arg => arg && is.function(arg.then),

 // @description is a given arg a stream?
 // @arg {*} arg - the item you want to check and see if it's a `stream`
 // @returns {boolean}
 stream: arg => arg && is.function(arg.pipe),

 // @description is a given arg a stream?
 // @arg {*} arg - the item you want to check and see if it's a `stream`
 // @returns {boolean}
 buffer: arg => Buffer.isBuffer(arg)
};

// included method does not support `all` and `any` interfaces
is.included.api = ["not"];

// within method does not support `all` and `any` interfaces
is.between.api = ["not"];

// `above` method does not support `all` and `any` interfaces
is.above.api = ["not"];

// least method does not support `all` and `any` interfaces
is.under.api = ["not"];


is.in.api = ["not"];

is.all.in = (obj, ...values) => {
 values = to.array.flat(values);
 for(let i in values){
  if(!is.in(obj, values[i])){
   return false;
  }
 }
 return true;
};

is.any.in = (obj, ...values) => {
 values = to.array.flat(values);
 for(let i in values){
  if(is.in(obj, values[i])){
   return true;
  }
 }
 return false;
};

const not = (func) => () => !func.apply(null, array_slice(arguments)),
      all = (func) => {
       return function(){
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
      setInterfaces = (() => {
       var options = is;
       for(var option in options){
        if(hasOwnProperty.call(options, option) && is.function(options[option])){
         var interfaces = options[option].api || ["not", "all", "any"];
         for(let i in interfaces){
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
      })();
