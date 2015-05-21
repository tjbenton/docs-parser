"use strict";

////
//// @name docs.js
//// @author Tyler Benton
//// @version 0.0.1
//// @descripton
/// This is used to parse any filetype that you want to and gets the documentation for it and returns an {} of the document data
////
var docs = (function(){
 // A few helper functions for checking common things.
 // It's not located under the main object (_) because these are just helper functions.
 var is = {},
     toString = Object.prototype.toString; // cache to call later on

 //// @description is a given value function?
 //// @arg {*} value - The item to check
 //// @returns {boolean} - The result of the test
 is.function = function(value){ // fallback check is for IE
  return toString.call(value) === "[object Function]" || typeof value === "function";
 };

 //// @description is a given value Array?
 //// @arg {*} value - The item to check
 //// @returns {boolean} - The result of the test
 is.array = Array.isArray || function(value){ // check native isArray first
  return toString.call(value) === "[object Array]";
 };

 /// @description is a given value Boolean?
 /// @arg {*} value - The item to check
 /// @returns {boolean} - The result of the test
 is.boolean = function(value){
  return value === true || value === false || toString.call(value) === "[object Boolean]";
 };

 /// @description is a given value object?
 /// @arg {*} value - The item to check
 /// @returns {boolean} - The result of the test
 is.object = function(value){
  return toString.call(value) === "[object Object]";
 };

 /// @description is a given value empty? Objects, arrays, strings
 /// @arg {object, array, string} value - What you want to check to see if it's empty
 /// @returns {boolean} - determins if the item you passes was empty or not
 is.empty = function(value){
  return is.object(value) ? Object.getOwnPropertyNames(value).length === 0 : is.array(value) ? value.length > 0 : value === "";
 };

 /// @description is a given value String?
 /// @arg {*} value - The item to check
 /// @returns {boolean} - The result of the test
 is.string = function(value){
  return toString.call(value) === "[object String]";
 };

 /// @description is a given value undefined?
 /// @arg {*} value - The item to check
 /// @returns {boolean}
 is.undefined = function(value){
  return value === void 0;
 };

 /// @description is a given string include parameter substring?
 /// @arg {string} str - string to match against
 /// @arg {string} substr - string to look for in `str`
 /// @returns {number, boolean}
 is.included = function(str, substr){
  var index = str.indexOf(substr);
  return !is.empty(str) && !is.empty(substr) ? index > -1 ? index : false : false;
 };

 /// @description is a given value false
 /// @arg {*} value - value to check if it is false
 /// @returns {boolean}
 is.false = function(value){
  return value === false;
 };

 /// @description is a given value truthy?
 /// @arg {*} value - the item you want to check and see if it's truthy
 /// @returns {boolean}
 is.truthy = function(value){
  return value !== null && value !== undefined && value !== false && !(value !== value) && value !== "" && value !== 0;
 };

 /// @description is given value falsy?
 /// @arg {*} value - the item you want to check and see if it's falsy
 /// @returns {boolean}
 is.falsy = function(value){
  return !is.truthy(value);
 };

 var _ = {}, // the main object to return
     fs = require("fs"),
     glob = require("glob"),
     get_blocks,
     parse_blocks;

 /// @description
 /// Extend object `b` onto `a`
 /// http://jsperf.com/deep-extend-comparison
 /// @arg {Object} a Source object.
 /// @arg {Object} b Object to extend with.
 /// @returns {Object} a Extended object.
 _.extend = function(a, b){
  // Don't touch 'null' or 'undefined' objects.
  if(!a || !b){
   return a;
  }

  for(var i = 0, keys = Object.keys(b), l = keys.length; i < l; i++){
   var key = keys[i];

   // Detect object without array, date or null.
   if(is.object(b[key])){
    if(!is.object(a[key])){
     a[key] = b[key];
    }else{
     a[key] = _.extend(a[key], b[key]);
    }
   }else{
    a[key] = b[key];
   }
  }
  return a;
 };


 // the settings object that holds the file specific settings as well as the base settings
 _.all_settings = {
  default: {
   // file level comment block identifier
   file_comment: {
    start: "////",
    line: "///",
    end: "////"
   },

   // block level comment block identifier
   block_comment: {
    line: "///"
   },

   // the start of the parser id(this should probably never be changed)
   parser_prefix: "@"
  },
  css: {
   file_comment: {
    start: "/***",
    line: "*",
    end: "***/"
   },
   block_comment: {
    start: "/**",
    line: "*",
    end: "**/"
   }
  }
 };

 /// @description Merges the default settings with the file specific settings
 /// @arg {string} filetype - the current filetype that is being parsed
 /// @returns {object} the settings to use
 _.settings = function(filetype){
  return !is.undefined(_.all_settings[filetype]) ? _.extend(_.all_settings.default, _.all_settings[filetype]) : _.all_settings.default;
 };

 /// @description Allows you to specify settings for specific file types
 /// @arg {string} extention - the file extention you want to target
 /// @arg {object} obj - the settings you want to adjust for this file type
 _.setting = function(extention, obj){
  var to_extend = {};
  to_extend[extention] = obj;
  return _.extend(_.all_settings, to_extend);
 };

 // the parsers object
 _.all_parsers = {};

 /// @description
 /// This gets the parsers to use for the current filetype.
 /// Basically the file specific parsers get extended onto the default parsers
 /// @arg {string} filetype - the current filetype that is being parsed
 /// @returns {object} the settings to use
 _.parsers = function(filetype){
  return !is.undefined(_.all_parsers[filetype]) ? _.extend(_.extend({}, _.all_parsers.default), _.all_parsers[filetype]) : _.all_parsers.default;
 };

 /// @description
 /// Removes extra whitespace before all the lines that are passed
 /// Removes trailing blank lines
 /// Removes all whitespace at the end of each line
 /// @arg {array} content - The array of lines that will be normalized
 /// @returns {string} - The normalized string
 _.normalize = function(content){
  // remove trailing blank lines
  for(var i = content.length; i-- && content[i].length === 0;){
   content.pop();
  }

  // get the length of extra whitespace to cut off of the beginning of each line in content array
  var slice_from = content.join("\n").match(/^\s*/gm).sort(function(a, b){
       return a.length - b.length;
      })[0].length;

  // remove extra whitespace
  return content.map(function(line){
   return line.slice(slice_from);
  }).join("\n").replace(/[^\S\r\n]+$/gm, ""); // convert to string and remove all trailing white spaces
 };

 /// @description
 /// Used to create a temp object with a specific key name
 /// @arg {string} key - name that you want the key to be
 /// @arg {*} value - the value of the key
 _.create_object = function(key, value){
  var temp = {};
  temp[key] = value;
  return temp;
 };

 /// @description Used to define the parsers
 /// @arg {string} name - The name of the variable
 /// @arg {object} obj - The callback to be executed at parse time
 _.parser = function(name, obj){
  if(is.function(obj)){
   obj = {
    default: obj
   };
  }

  for(var item in obj){
   var to_extend = {},
       result = {};
   to_extend[name] = obj[item];
   result[item] = _.extend(_.all_parsers[item] || {}, to_extend);
   _.extend(_.all_parsers, result);
  }
 };

 /// @description Parses the file and returns the comment blocks in an array
 /// @arg {string}
 /// @returns {array} of the comment blocks
 get_blocks = function(){
  var _blocks = [], // holds all the blocks
      _file_block = { // holds the file level comment block
       contents: [],
       start: -1,
       end: -1
      },
      block_info, // holds the current block information
      lines = this.file.contents.split(/\n/), // all the lines in the file
      setting = this.setting, // stores the settings because it's removed from `this`

      // file specific variables
      is_start_and_end_file_comment = !is.undefined(setting.file_comment.start) && !is.undefined(setting.file_comment.end), // determins if the file comment has a start and end style or is line by line
      in_file_comment = false, // used to determin if you're in a file level comment or not

      // block specific variables
      is_start_and_end = !is.undefined(setting.block_comment.start) && !is.undefined(setting.block_comment.end), // determins if the block comment has a start and end style or is line by line
      in_comment = false, // used to determin that you are in a comment
      in_code = false, // used to determin if you are in the code after the comment block

      // variables that are shared between the two loops
      i = 0, // current array item
      l = lines.length; // the length of the lines array

  // remove the settings from this because it doesn't need to be on every block.
  delete this.setting;

  // a) file level comment exists
  if(is_start_and_end_file_comment ? !is.false(is.included(this.file.contents, setting.file_comment.start)) : setting.file_comment.line !== setting.block_comment.line ? !is.false(is.included(this.file.contents, setting.file_comment.line)) : false){
   // loop over each line to look for file level comments
   for(; i < l; i++){
    var line = lines[i],
        file_comment = {
         line: is.included(line, setting.file_comment.line),
         start: is_start_and_end_file_comment ? is.included(line, setting.file_comment.start) : false,
         end: is_start_and_end_file_comment ? is.included(line, setting.file_comment.end) : false
        };

    // a) is the start and end style or there was an instance of a comment line
    if(!is.false(file_comment.start) && _file_block.start === -1 || !in_file_comment && !is.false(file_comment.line)){
     in_file_comment = true;
     _file_block.start = i;
    }

    // a) adds this line to block_info comment contents
    if(in_file_comment && is.false(file_comment.start) && is.false(file_comment.end)){
     // a) removes the `setting.file_comment.line` from the line
     if(!is.false(file_comment.line)){
      line = line.slice(file_comment.line + setting.file_comment.line.length);
     }
     _file_block.contents.push(line);
    }

    // a) check for the end of the file level comment
    if((is_start_and_end_file_comment && _file_block.start !== i && !is.false(file_comment.end)) || (!is_start_and_end_file_comment && !is.false(is.included(lines[i + 1], setting.file_comment.line)))){
     in_file_comment = false;
     _file_block.end = i;
     i++; // added 1 more to `i` so that the next loop starts on the next line
     break; // ensures that the loop stops because there's only 1 file level comment per file
    }
   }
  }

  // loop over each line in the file and gets the comment blocks
  for(; i < l; i++){
   var line = lines[i],
       comment_index = {
        line: is.included(line, setting.block_comment.line),
        start: is_start_and_end ? is.included(line, setting.block_comment.start) : false,
        end: is_start_and_end ? is.included(line, setting.block_comment.end) : false
       };

   // a) is the start and end style or there was an instance of a comment line
   if(is_start_and_end || !is.false(comment_index.line)){
    // a) is the start of a new block
    if(!is.false(comment_index.start) || !is_start_and_end && !in_comment){
     in_code = false;

     // a) There was block that has already been processed
     if(!is.undefined(block_info)){ // holds the current block information
      block_info.code.end = i - 1;
      _blocks.push(block_info);
     }

     // reset the `block_info` to use on the new block
     block_info = _.extend({
      comment: {
       contents: [],
       start: i,
       end: 0
      },
      code: {
       contents: [],
       start: 0,
       end: 0
      }
     }, this);

     in_comment = true;
    }

    // a) check for the end comment
    if(is_start_and_end && !is.false(comment_index.end)){
     in_comment = false;
     block_info.comment.end = i;
     i++; // skips end comment line
     line = lines[i]; // updates to be the next line
     comment_index.end = is.included(setting.block_comment.end); // updates the index
    }

    // a) adds this line to block_info comment contents
    if(in_comment && is.false(comment_index.start) && is.false(comment_index.end)){
     // a) removes the `setting.block_comment.line` from the line
     if(!is.false(comment_index.line)){
      line = line.slice(comment_index.line + setting.block_comment.line.length);
     }
     block_info.comment.contents.push(line);
    }

    // b) check the next line for an instance of the a line comment
    if(!is_start_and_end && is.false(is.included(lines[i + 1], setting.block_comment.line))){
     in_comment = false;
    }

    // a) The last line in the file is a commment
    if(in_comment && (is_start_and_end && !is.false(comment_index.end) ? i === l : i === l - 1)){
     block_info.comment.end = is_start_and_end ? i - 1 : i;
     _blocks.push(block_info);
     break; // ensures that the loop stops because it's the last line in the file
    }
   } // end comment code


   // a) add code to current block_info
   if(!in_comment && is.false(comment_index.end) && !is.undefined(block_info)){
    // a) The previous line was a comment
    if(!in_code){
     in_code = true;
     block_info.code.start = i;
    }

    // adds this line to block code contents
    block_info.code.contents.push(line);

    // a) pushes the last block onto the _blocks
    if(i === l - 1){
     block_info.code.end = i;
     _blocks.push(block_info);
    }
   }
  } // end loop

  return _blocks;
 };

 /// @description Parses each block in blocks
 /// @returns {array}
 parse_blocks = function(){
  var parser_keys = Object.getOwnPropertyNames(this.parsers);
  this.parsed_blocks = [];

  /// @description Used as a helper function because this action is performed in two spots
  /// @arg {object} annotation - information of the current parser block
  /// @arg {object} info - information about the current comment block, the code after the comment block and the full file contents
  this.parse = function(annotation, info){
   var name = annotation.name,
       to_call,
       to_extend;

   // removes the first line because it's the "line" of the parser
   annotation.contents.shift();

   // normalizes the current parser block contents
   annotation.contents = _.normalize(annotation.contents);


   // Merges the data together so it can be used to run all the parsers
   to_call = _.extend({
              parser: annotation // sets the parser block information to be in it's own namespace of `parser`
             }, info);

   // a) add the default parser function to the `annotation.parsers` object so it can be called in the file specific parser if needed
   if(!is.undefined(_.all_parsers[info.file.type]) && !is.undefined(_.all_parsers[info.file.type][name])){
    _.extend(to_call, {
     default: function(){
      return _.all_parsers.default[name].call(to_call);
     }
    });
   }

   // call the parser function and store the result
   to_extend = this.parsers[name].call(to_call);

   // a) the current item being merged is already defined in the base
   // b) define the target
   if(!is.undefined(parsers_in_block[name])){
    // a) convert the target to an array
    // b) add item to the current target array
    if(!is.array(parsers_in_block[name])){
     parsers_in_block[name] = [parsers_in_block[name], to_extend];
    }else{
     parsers_in_block[name].push(to_extend);
    }
   }else{
    parsers_in_block[name] = to_extend;
   }
   return parsers_in_block;
  };

  // loop over each block
  for(var a = 0, blocks_length = this.blocks.length; a < blocks_length; a++){
   var block = this.blocks[a],
       to_parse = block.comment.contents,
       parsers_in_block = {},
       current_parser = {};

   block.comment.contents = _.normalize(block.comment.contents);
   block.code.contents = _.normalize(block.code.contents);

   // loop over each line in the comment block
   for(var i = 0, l = to_parse.length; i < l; i++){
    var line = to_parse[i],
        parser_prefix_index = line.indexOf(this.setting.parser_prefix);

    // a) there is an index of the parser prefix
    if(parser_prefix_index >= 0){
     var first_space = line.indexOf(" ", parser_prefix_index),
         name_of_parser = line.slice(parser_prefix_index + 1, first_space >= 0 ? first_space : line.length);

     // a) the name is one of the parser names
     if(parser_keys.indexOf(name_of_parser) >= 0){
      if(!is.empty(current_parser)){
       current_parser.end = i - 1;
       this.parse(current_parser, block);
      }

      // redefines resets the current parser to be blank
      current_parser = {
       name: name_of_parser, // sets the current parser name
       line: line.slice(parser_prefix_index + 1 + name_of_parser.length).trim(), // removes the current parser name and it's prefix from the first line
       contents: [],
       start: i, // sets the starting line of the parser
       end: 0
      };
     }
    }

    // adds the current line to the contents
    if(!is.empty(current_parser)){
     current_parser.contents.push(line);
    }

    // a) is the last line in the comment block
    if(i === l - 1){
     current_parser.end = i;
     this.parsed_blocks.push(this.parse(current_parser, block));
    }
   } // end block loop
  } // end blocks loop

  return this.parsed_blocks;
 };

 /// @description Takes the contents of a file and parses it
 /// @arg {string, array} files - file paths to parse
 /// @arg {function} callback - the callback to exicute after the files are parsed.
 _.parse = function(files, callback){
  var paths = [],
      json = {};

  // converts the string to an array so it can be looped over
  if(is.string(files)){
   files = [files];
  }

  // get the files paths using glob
  for(var i = files.length; i--;){
   paths.push.apply(paths, glob.sync(files[i]));
  }

  return (function(paths){
   for(var current_file = 0, total_files = paths.length; current_file < total_files; current_file++){
    var path = paths[current_file],
        filetype = path.slice(path.lastIndexOf(".") + 1),
        setting = _.settings(filetype),
        file = fs.readFileSync(path) + "", // the `""` converts the file from a buffer to a string
        parsed_blocks = parse_blocks.call({
         setting: setting,
         parsers: _.parsers(filetype),
         blocks: get_blocks.call({
          setting: setting,
          file: {
           contents: file,
           path: path,
           type: filetype,
           start: 0,
           end: file.split("\n").length - 1
          }
         })
        });

    // a) if the current block is undefined in the json objected then create it
    if(is.undefined(json[filetype])){
     json[filetype] = [];
    }

    // merges the existing array with the new blocks arrays
    json[filetype].push.apply(json[filetype], parsed_blocks);
   }

   // run the callback of parse
   callback(json);
  })(paths.reverse());
 };

 return _;
})();

// settings for markdown
docs.setting("md", {
 file_comment: "###",
 block_comment: "##"
});


// base parsers
docs.parser("name", {
 default: function(){
  return this.parser.line;
 },
 scss: function(){
  return this.default() + " scss version";
 }
});

docs.parser("description", function(){
 return this.parser.line || this.parser.contents;
});

docs.parser("page", function(){
 return this.parser.line;
});

docs.parser("author", function(){
 return this.parser.line;
});

docs.parser("markup", function(){
 return this.parser.contents;
});

// Module exports
// a) export module
// b) define amd
// c) add docs to the root
if(typeof exports !== "undefined"){
 if(typeof module !== "undefined" && module.exports){
  exports = module.exports = docs;
 }
 exports.docs = docs;
}else if(typeof define === "function" && define.amd){ // AMD definition
 define(function(require){
  return docs;
 });
}else{
 root[ "docs" ] = docs;
}