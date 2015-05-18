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

 // @description is a given value String?
 // @arg [*] - The item to check
 // @returns [boolean] - The result of the test
 is.string = function(value){
  return Object.prototype.toString.call(value) === "[object String]";
 };

 var _ = {}, // the main object to return
     fs = require("fs"),
     blocks = [];

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
   file_comment: "////", // file level comment blockidentifier
   block_comment: "///", // block level comment block identifier
   parser_prefix: "@" // the start of the parser id(this should probably never be changed)
  }
 };

 // @arg [string] - the current filetype that is being parsed
 // @returns [object] the settings to use
 _.settings = function(filetype){
  return _.all_settings[filetype] !== undefined ? _.extend(_.all_settings.default, _.all_settings[filetype]) : _.all_settings.default;
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

 // @arg [string] - the current filetype that is being parsed
 // @returns [object] the settings to use
 _.parsers = function(filetype){
  return _.all_parsers[filetype] !== undefined ? _.extend(_.all_parsers.default, _.all_parsers[filetype]) : _.all_parsers.default;
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

 // @description Takes the contents of a file and parses it
 // @arg [string, array] files - file paths to parse
 // @arg [function] callback - the callback to exicute after the files are parsed.
 _.parse = function(files, callback){
  // converts the string to an array so it can be looped over
  if(is.string(files)){
   files = [files];
  }

  // loop over each file file in files and parse the data.
  for(var i = 0, l = files.length; i < l; i++){
   var path = files[i],
       filetype = path.slice(path.lastIndexOf(".") + 1),
       setting = _.settings(filetype),
       parsers = _.parsers(filetype),
       parser_keys = Object.keys(parsers);

   fs.exists(path, function(exists){
    if(!exists){
     console.error("`" + path + "`" + " doesn't exist");
    }else{
     var file = fs.readFileSync(path) + "", // the `""` converts the file from a buffer to a string

         // @description Parses the file and returns the comment blocks in an array
         // @arg [string] file
         // @returns [array] of the comment blocks
         blocks = (function(){
          var _blocks = [],
              block,
              push_block = false,
              lines = file.split(/\n/),
              in_code = false,
              in_comment = false;

          // loop over each line in the file and gets the comment blocks
          for(var i = 0, l = lines.length; i < l; i++){
           var line = lines[i],
               comment_index = line.indexOf(setting.block_comment);

           // a) The line is a comment
           // b) There was a previous comment block
           if(comment_index > -1){
            line = line.slice(comment_index + setting.block_comment.length);

            // a) The previous line wasn't a comment
            if(!in_comment){
             in_code = false;
             if(block !== undefined){
              block.code.end = i - 1;
              _blocks.push(block);
             }

             block = { // reset the `block`
              file: {
               contents: file,
               path: path,
               type: filetype,
              },
              comment: {
               contents: [],
               start: 0,
               end: 0
              },
              code: {
               contents: [],
               start: 0,
               end: 0
              }
             };

             block.comment.start = i;
             in_comment = true;
            }

            // adds this line to block comment contents
            block.comment.contents.push(line);

            // a) The last line in the file is a commment
            if(i === l - 1){
             block.comment.end = i;
             _blocks.push(block);
            }
           }else if(block !== undefined){
            if(in_comment){
             in_comment = false;
             block.comment.end = i - 1; // -1 because the end was the line before
            }

            // a) The previous line was a comment
            if(!in_code){
             in_code = true;
             block.code.start = i;
            }

            // adds this line to block code contents
            block.code.contents.push(line);

            if(i === l - 1){
             block.code.end = i;
             _blocks.push(block);
            }
           }
          } // end loop

          return _blocks;
         })(),

         // @description Parses each block in blocks
         // @arg [array] the blocks that are returned from blocks
         // @returns [array]
         parsed_blocks = (function(blocks){
          var _parsed_blocks = [],
              _parsers_in_block = {},
              _current_parser_info = {
               contents: [],
               start: 0,
               end: 0
              },
              _current_parser_name;

          // loop over each block
          for(var a = 0, blocks_length = blocks.length; a < blocks_length; a++){
           var block = blocks[a],
               to_parse = block.comment.contents;

           // loop over each line in the comment block
           for(var i = 0, l = to_parse.length; i < l; i++){
            var line = to_parse[i],
                parser_prefix_index = line.indexOf(setting.parser_prefix);

            // a) there is an index of the parser prefix
            if(parser_prefix_index >= 0){
             var first_space = line.indexOf(" ", parser_prefix_index),
                 name_of_parser = line.slice(parser_prefix_index + 1, first_space >= 0 ? first_space : line.length);

             // a) the name is one of the parser names
             if(parser_keys.indexOf(name_of_parser) >= 0){
              if(_current_parser_name !== undefined){
               // call the parser function
               _current_parser_info.end = i - 1;
               parse(_current_parser_name, _current_parser_info, block);
              }

              // resets the current parser to be blank
              _current_parser_info = {
               contents: [],
               start: 0,
               end: 0
              };

              _current_parser_name = name_of_parser;
              _current_parser_info.start = i;

              // removes the current parser name and it's prefix from the first line
              line = line.slice(parser_prefix_index + 1 + name_of_parser.length).trim();
             }
            }

            // adds the current line to the contents
            _current_parser_info.contents.push(line);

            // a) parse the current block push it to the parsed blocks
            if(i === l - 1 && name_of_parser !== undefined && _current_parser_info.contents.length){
             _current_parser_info.end = i - 1;
             _parsed_blocks.push(parse(_current_parser_name, _current_parser_info, block));
            }
           } // end block loop
          } // end blocks loop

          // @description Used as a helper function because this action is performed in two spots
          // @arg [string] name of the parser to run
          // @arg [object] information of the current parser block
          // @arg [object] information about the current comment block, the code after the comment block and the full file contents
          function parse(name, parser_block, block_info){
           parser_block.name = name;
           parser_block = {
            parser: parser_block
           };
           return (function(to_extend){
            // a) the current item being merged is already defined in the base
            // b) define the target
            if(_parsers_in_block[name] !== undefined){
             // a) convert the target to an array
             // b) add item to the current target array
             if(!is.array(_parsers_in_block[name])){
              _parsers_in_block[name] = [_parsers_in_block[name], to_extend];
             }else{
              _parsers_in_block[name].push(to_extend);
             }
            }else{
             _parsers_in_block[name] = to_extend;
            }
            return _parsers_in_block;
           })(parsers[name].call(_.extend(parser_block, block_info)));
          };

          return _parsed_blocks;
         })(blocks);

     console.log("");
     console.log("parsed_blocks = ", parsed_blocks);
    }
   });
  }

  // the callback is called after the files have been parsed
  callback();
 };


 return _;
})();

// settings for markdown
docs.setting("md", {
 file_comment: "###",
 block_comment: "##"
});


// base parsers
docs.parser("name", function(){
 return this.parser.contents[0];
});

docs.parser("description", function(){
 return this.parser.contents.join("\n");
});

docs.parser("page", function(){
 return "yo this was a page";
});

docs.parser("author", function(){
 return "yo this was a author";
});

docs.parser("markup", function(){
 return "yo this was a markup";
});

// Module exports
if(typeof exports !== "undefined"){
 if(typeof module !== "undefined" && module.exports){
  exports = module.exports = docs;
 }
 exports.docs = docs;
}else{
 root[ "docs" ] = docs;
}

// AMD definition
if(typeof define === "function" && define.amd){
 define(function(require){
  return docs;
 });
}