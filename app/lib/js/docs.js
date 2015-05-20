"use strict";

// docs.js
// @author Tyler Benton
// @descripton
// This is used to parse any filetype that you want to and gets the documentation for it and returns an {} of the document data
var docs = (function(){
 // A few helper functions for checking common things.
 // It's not located under the main object (_) because these are just helper functions.
 var is = {};

 // @description is a given value function?
 // @arg [*] - The item to check
 // @returns [boolean] - The result of the test
 is.function = function(value){ // fallback check is for IE
  return Object.prototype.toString.call(value) === "[object Function]" || typeof value === "function";
 };

 // @description is a given value Array?
 // @arg [*] - The item to check
 // @returns [boolean] - The result of the test
 is.array = Array.isArray || function(value){ // check native isArray first
  return Object.prototype.toString.call(value) === "[object Array]";
 };

 // @description is a given value Boolean?
 // @arg [*] - The item to check
 // @returns [boolean] - The result of the test
 is.boolean = function(value){
  return value === true || value === false || Object.prototype.toString.call(value) === "[object Boolean]";
 };

 // @description is a given value object?
 // @arg [*] - The item to check
 // @returns [boolean] - The result of the test
 is.object = function(value){
  return Object.prototype.toString.call(value) === "[object Object]";
 };

 // @description is a given value empty? Objects, arrays, strings
 // @arg [object, array, string] - What you want to check to see if it's empty
 // @returns [boolean] - determins if the item you passes was empty or not
 is.empty = function(value){
  return is.object(value) ? Object.getOwnPropertyNames(value).length === 0 : is.array(value) ? value.length > 0 : value === "";
 };

 // @description is a given value String?
 // @arg [*] - The item to check
 // @returns [boolean] - The result of the test
 is.string = function(value){
  return Object.prototype.toString.call(value) === "[object String]";
 };

 // @description is a given value undefined?
 // @arg [*] - The item to check
 // @returns [boolean]
 is.undefined = function(value){
  return value === void 0;
 };

 // is a given string include parameter substring?
 is.included = function(str, substr) {
  var index = str.indexOf(substr);
  return !is.empty(str) && !is.empty(substr) ? index > -1 ? index : false : false;
 };

 // is a given value false
 is.false = function(value){
  return value === false;
 };

 // is a given value truthy?
 is.truthy = function(value) {
  return value !== null && value !== undefined && value !== false && !(value !== value) && value !== "" && value !== 0;
 };

 // is given value falsy?
 is.falsy = function(value){
  return !is.truthy(value);
 }

 var _ = {}, // the main object to return
     fs = require("fs"),
     glob = require("glob"),
     get_blocks,
     parse_blocks;

 // @description
 // Extend object `b` onto `a`
 // http://jsperf.com/deep-extend-comparison
 // @arg [Object] a Source object.
 // @arg [Object] b Object to extend with.
 // @returns [Object] a Extended object.
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
    start: null,
    line: "////",
    end: null
   },

   // block level comment block identifier
   block_comment: {
    start: null,
    line: "///",
    end: null
   },

   // the start of the parser id(this should probably never be changed)
   parser_prefix: "@"
  },
  css: {
   file_comment: {
    start: "/****",
    line: "*",
    end: "****/"
   },
   block_comment: {
    start: "/**",
    line: "*",
    end: "**/"
   }
  }
 };

 // @arg [string] - the current filetype that is being parsed
 // @returns [object] the settings to use
 _.settings = function(filetype){
  return !is.undefined(_.all_settings[filetype]) ? _.extend(_.all_settings.default, _.all_settings[filetype]) : _.all_settings.default;
 };

 // @description Allows you to specify settings for specific file types
 // @arg [string] - the file extention you want to target
 // @arg [object] - the settings you want to adjust for this file type
 _.setting = function(extention, obj){
  var to_extend = {};
  to_extend[extention] = obj;
  return _.extend(_.all_settings, to_extend);
 };

 // the parsers object
 _.all_parsers = {};

 // @description
 // This gets the parsers to use for the current filetype.
 // Basically the file specific parsers get extended onto the default parsers
 // @arg [string] - the current filetype that is being parsed
 // @returns [object] the settings to use
 _.parsers = function(filetype){
  return !is.undefined(_.all_parsers[filetype]) ? _.extend(_.extend({}, _.all_parsers.default), _.all_parsers[filetype]) : _.all_parsers.default;
 };

 // @description
 // Removes extra whitespace before all the lines that are passed
 // Removes trailing blank lines
 // Removes all whitespace at the end of each line
 // @arg [array] - The array of lines that will be normalized
 // @returns [string] - The normalized string
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

 // @description
 // Used to create a temp object with a specific key name
 // @arg [string] - name that you want the key to be
 // @arg [*] - the value of the key
 _.create_object = function(key, value){
  var temp = {};
  temp[key] = value;
  return temp;
 };

 // @description Used to define the parsers
 // @arg [string] The name of the variable
 // @arg [object] The callback to be executed at parse time
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

 // @description Parses the file and returns the comment blocks in an array
 // @arg [string] file
 // @returns [array] of the comment blocks
 get_blocks = function(){
  var _blocks = [],
      block_info,
      lines = this.file.contents.split(/\n/),
      setting = this.setting,
      in_code = false,
      in_comment = false;

  // remove the settings from this because it doesn't need to be on every block.
  delete this.setting;

  // loop over each line in the file and gets the comment blocks
  for(var i = 0, l = lines.length; i < l; i++){
   var line = lines[i],
       comment_index = line.indexOf(setting.block_comment.line);

   // a) The line is a comment
   // b) There was a previous comment block
   if(comment_index > -1){
    line = line.slice(comment_index + setting.block_comment.line.length);

    // a) The previous line wasn't a comment
    if(!in_comment){
     in_code = false;

     // a) There was block that has already been processed
     if(!is.undefined(block_info)){
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

    // adds this line to block_info comment contents
    block_info.comment.contents.push(line);

    // a) The last line in the file is a commment
    if(i === l - 1){
     block_info.comment.end = i;
     _blocks.push(block_info);
    }
   }else if(!is.undefined(block_info)){
    if(in_comment){
     in_comment = false;
     block_info.comment.end = i - 1; // -1 because the end was the line before
    }

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

 // @description Parses each block in blocks
 // @arg [array] the blocks that are returned from blocks
 // @returns [array]
 parse_blocks = function(){
  var parser_keys = Object.getOwnPropertyNames(this.parsers);
  this.parsed_blocks = [];

  // @description Used as a helper function because this action is performed in two spots
  // @arg [string] name of the parser to run
  // @arg [object] information of the current parser block
  // @arg [object] information about the current comment block, the code after the comment block and the full file contents
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

 // @description Takes the contents of a file and parses it
 // @arg [string, array] files - file paths to parse
 // @arg [function] callback - the callback to exicute after the files are parsed.
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