"use strict";

////
/// @name docs.js
/// @author Tyler Benton
/// @version 0.0.1
/// @descripton
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
     path = require("path"),
     paths = require("./paths.js"),
     Deferred = require("./deferred.js");

 /// @description
 /// Helper function to convert markdown text to html
 /// For more details on how to use marked [see](https://www.npmjs.com/package/marked)
 _.markdown = require("marked");

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
 _.file_specific_settings = {
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
  var defaults = {
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

   // the start of the annotation id(this should probably never be changed)
   annotation_prefix: "@"
  };

  return !is.undefined(_.file_specific_settings[filetype]) ? _.extend(defaults, _.file_specific_settings[filetype]) : defaults;
 };

 /// @description Allows you to specify settings for specific file types
 /// @arg {string} extention - the file extention you want to target
 /// @arg {object} obj - the settings you want to adjust for this file type
 _.setting = function(extention, obj){
  return _.extend(_.file_specific_settings, _.create_object(extention, obj));
 };

 // the annotations object
 _.all_annotations = {};

 /// @description
 /// This gets the annotations to use for the current filetype.
 /// Basically the file specific annotations get extended onto the default annotations
 /// @arg {string} filetype - the current filetype that is being parsed
 /// @returns {object} the settings to use
 _.annotations = function(filetype){
  return !is.undefined(_.all_annotations[filetype]) ? _.extend(_.extend({}, _.all_annotations.default), _.all_annotations[filetype]) : _.all_annotations.default;
 };

 /// @description
 /// Removes extra whitespace before all the lines that are passed
 /// Removes trailing blank lines
 /// Removes all whitespace at the end of each line
 /// @arg {array, string} content - The array of lines that will be normalized
 /// @returns {string} - The normalized string
 _.normalize = function(content){
  content = is.string(content) ? [content] : content;

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

 /// @description Used to define the new annotations
 /// @arg {string} name - The name of the variable
 /// @arg {object} obj - The callback to be executed at parse time
 _.annotation = function(name, obj){
  if(is.function(obj)){
   obj = {
    default: obj
   };
  }

  for(var item in obj){
   var to_extend = {},
       result = {};
   to_extend[name] = obj[item];
   result[item] = _.extend(_.all_annotations[item] || {}, to_extend);
   _.extend(_.all_annotations, result);
  }
 };

 // a small object to help with reading and writing the temp data.
 var temp_data = {
  get: function(){
   var def = new Deferred();
   fs.readFile(".tmp/data.json", function(err, data){
    // if(err){
    //  throw err;
    // }
    def.resolve(data);
   });
   return def.promise();
  },
  write: function(data){
   fs.writeFile(".tmp/data.json", data, function(err){
    if(err){
     throw err;
    }
   });
  }
 };

 _.parse_file = function(file_path){
  var get_blocks,
      parse_blocks,
      filetype = path.extname(file_path).replace(".", ""),
      setting = _.settings(filetype),
      annotations = _.annotations(filetype),
      file = fs.readFileSync(file_path) + "", // the `""` converts the file from a buffer to a string
      _obj = {
       file: {
        contents: file,
        path: file_path,
        type: filetype,
        start: 0,
        end: file.split("\n").length - 1
       }
      };

  /// @description Parses the file and returns the comment blocks in an array
  /// @arg {string}
  /// @returns {array} of the comment blocks
  get_blocks = function(){
   function new_block(i){
    return _.extend({
      comment: {
       contents: [],
       start: i,
       end: -1
      },
      code: {
       contents: [],
       start: -1,
       end: -1
      }
     }, _obj);
   };

   var _blocks = [], // holds all the blocks
       _file_block = new_block(-1), // holds the file level comment block
       block_info, // holds the current block information
       lines = _obj.file.contents.split(/\n/), // all the lines in the file

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

   // a) file level comment exists
   if(is_start_and_end_file_comment ? !is.false(is.included(_obj.file.contents, setting.file_comment.start)) : setting.file_comment.line !== setting.block_comment.line ? !is.false(is.included(_obj.file.contents, setting.file_comment.line)) : false){
    // loop over each line to look for file level comments
    for(; i < l; i++){
     var line = lines[i],
         file_comment = {
          line: is.included(line, setting.file_comment.line),
          start: is_start_and_end_file_comment ? is.included(line, setting.file_comment.start) : false,
          end: is_start_and_end_file_comment ? is.included(line, setting.file_comment.end) : false
         };

     // a) is the start and end style or there was an instance of a comment line
     if(!is.false(file_comment.start) && _file_block.comment.start === -1 || !in_file_comment && !is.false(file_comment.line)){
      in_file_comment = true;
      _file_block.comment.start = i;
     }

     // a) adds this line to block_info comment contents
     if(in_file_comment && is.false(file_comment.start) && is.false(file_comment.end)){
      // a) removes the `setting.file_comment.line` from the line
      if(!is.false(file_comment.line)){
       line = line.slice(file_comment.line + setting.file_comment.line.length);
      }
      _file_block.comment.contents.push(line);
     }

     // a) check for the end of the file level comment
     if((is_start_and_end_file_comment && _file_block.comment.start !== i && !is.false(file_comment.end)) || (!is_start_and_end_file_comment && !is.false(is.included(lines[i + 1], setting.file_comment.line)))){
      in_file_comment = false;
      _file_block.comment.end = i;
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
      block_info = new_block(i);

      in_comment = true;
     }

     // a) check for the end comment
     if(is_start_and_end && !is.false(comment_index.end)){
      in_comment = false;
      block_info.comment.end = i; // sets the end line in the comment block
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

     // a) check the next line for an instance of the a line comment
     if(!is_start_and_end && is.false(is.included(lines[i + 1], setting.block_comment.line))){
      in_comment = false;
      block_info.comment.end = i; // sets the end line in the comment block
      i++; // skips end comment line
      line = lines[i]; // updates to be the next line
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

   return {
    file: _file_block,
    general: _blocks // I have no idea what the key for this should be named but it probabaly shouldn't be `general`
   };
  };

  /// @description Parses each block in blocks
  /// @returns {array}
  parse_blocks = function(){
   var annotation_keys = Object.getOwnPropertyNames(annotations);

   /// @description Used as a helper function because this action is performed in two spots
   /// @arg {object} annotation - information of the current annotation block
   /// @arg {object} info - information about the current comment block, the code after the comment block and the full file contents
   /// @returns {object}
   this.merge = function(annotation, info){
    var name = annotation.name,
        to_call,
        to_extend,
        self = this;

    // removes the first line because it's the "line" of the annotation
    annotation.contents.shift();

    // normalizes the current annotation block contents
    annotation.contents = _.normalize(annotation.contents);


    // Merges the data together so it can be used to run all the annotations
    to_call = _.extend({
               annotation: annotation, // sets the annotation block information to be in it's own namespace of `annotation`

               /// @description Allows you to add a different annotation from within a annotation
               /// @arg {string} name - the name of the annotation you want to add
               /// @arg {string} str - information that is passed to the annotation
               add: function(name, str){
                str = str.split(/\n/);
                return self.merge({
                        name: name,
                        line: _.normalize(str[0]),
                        contents: str,
                        start: null,
                        end: null
                       }, info);
               }
              }, !is.undefined(info) ? info : {});

    // a) add the default annotation function to the object so it can be called in the file specific annotation functions if needed
    if(!is.undefined(_.all_annotations[info.file.type]) && !is.undefined(_.all_annotations[info.file.type][name])){
     _.extend(to_call, {
      default: function(){
       return _.all_annotations.default[name].call(to_call);
      }
     });
    }

    // run the annotation function and store the result
    to_extend = annotations[name].call(to_call);

    // a) the current item being merged is already defined in the base
    // b) define the target
    if(!is.undefined(this.annotations_in_block[name])){
     // a) convert the target to an array
     // b) add item to the current target array
     if(!is.array(this.annotations_in_block[name])){
      this.annotations_in_block[name] = [this.annotations_in_block[name], to_extend];
     }else{
      this.annotations_in_block[name].push(to_extend);
     }
    }else{
     this.annotations_in_block[name] = to_extend;
    }
    return this.annotations_in_block;
   };

   // @description
   // Used to parse an array of blocks and runs the annotations function and returns the result
   // @arg {object, array} - The block/blocks you want to have parsed
   // @returns {array} of parsed blocks
   this.parse = function(blocks){
    var parsed_blocks = [];

    // if it's an object then convert it to an array.
    blocks = is.object(blocks) ? [blocks] : is.array(blocks) ? blocks : [];

    // loop over each block
    for(var a = 0, blocks_length = blocks.length; a < blocks_length; a++){
     var block = blocks[a],
         to_parse = block.comment.contents,
         _annotation = {};
     this.annotations_in_block = {};

     block.comment.contents = _.normalize(block.comment.contents);
     block.code.contents = _.normalize(block.code.contents);

     // loop over each line in the comment block
     for(var i = 0, l = to_parse.length; i < l; i++){
      var line = to_parse[i],
          annotation_prefix_index = line.indexOf(setting.annotation_prefix);

      // a) there is an index of the annotation prefix
      if(annotation_prefix_index >= 0){
       var first_space = line.indexOf(" ", annotation_prefix_index),
           name_of_annotation = line.slice(annotation_prefix_index + 1, first_space >= 0 ? first_space : line.length);

       // a) the name is one of the annotation names
       if(annotation_keys.indexOf(name_of_annotation) >= 0){
        // a) parse the current annotation
        if(!is.empty(_annotation)){
         _annotation.end = i - 1;
         this.merge(_annotation, block);
        }

        // redefines resets the current annotation to be blank
        _annotation = {
         name: name_of_annotation, // sets the current annotation name
         line: line.slice(annotation_prefix_index + 1 + name_of_annotation.length).trim(), // removes the current annotation name and it's prefix from the first line
         contents: [],
         start: i, // sets the starting line of the annotation
         end: 0
        };
       }
      }

      // a) adds the current line to the contents
      if(!is.empty(_annotation)){
       _annotation.contents.push(line);
      }

      // a) is the last line in the comment block
      if(i === l - 1){
       _annotation.end = i;
       parsed_blocks.push(this.merge(_annotation, block));
      }
     } // end block loop
    } // end blocks loop
    return parsed_blocks;
   };

   // parses the file and gets the results
   var file_annotations = !is.empty(this.file) ? this.parse(this.file)[0] : false,
       parsed_blocks = this.parse(this.general);

   // a) loop over each parsed blocks and set the file level annotations
   if(!is.false(file_annotations)){
    var _blocks = [];
    for(var i = 0, l = parsed_blocks.length; i < l; i++){
     _blocks.push(_.extend(_.extend({}, file_annotations), parsed_blocks[i]));
    }
    parsed_blocks = _blocks;
   }

   return parsed_blocks;
  };

  return parse_blocks.call(get_blocks());
 };

 /// @description Takes the contents of a file and parses it
 /// @arg {string, array} files - file paths to parse
 /// @returns {object} - the data that was parsed
 _.parse = function(files){
  var json = {},
      _data = temp_data.get(),
      def = new Deferred();

  Deferred.when(paths(files))
   .done(function(file_paths){
    for(var i = 0, l = file_paths.length; i < l; i++){
     var file_path = file_paths[i],
         filetype = path.extname(file_path).replace(".", "");

     // a) if the current block is undefined in the json objected then create it
     if(is.undefined(json[filetype])){
      json[filetype] = [];
     }

     // merges the existing array with the new blocks arrays
     json[filetype].push.apply(json[filetype], _.parse_file(file_path));
    }

    def.resolve({
     // @description Placeholder for the data so if it's manipulated the updated data will be in the other functions
     data: json,

     /// @description Helper function to write out the data to a json file
     /// @arg {string} location - The location to write the file too
     /// @arg {number,\t,\s} spacing [1] - The spacing you want the file to have.
     /// @returns {this}
     write: function(location, spacing){
      fs.writeFile(location, JSON.stringify(this.data, null, !is.undefined(spacing) ? spacing : 1), function(err){
       if(err){
        throw err;
       }
      });
      return this;
     },

     /// @todo {tylerb} - Add a way to documentize the files
     /// This should be apart of it's own code base so it doesn't pollute this one.
     /// @returns {this}
     documentize: function(){
      console.log("documentize");
     }
    });
   });
  return def.promise();
 };

 return _;
})();

// base annotations
docs.annotation("name", function(){
 return this.annotation.line;
});

docs.annotation("page", function(){ // group
 return this.annotation.line;
});

docs.annotation("author", function(){
 return this.annotation.line;
});

docs.annotation("description", function(){
 return docs.markdown(this.annotation.line ? this.annotation.line + "\n" + this.annotation.contents : this.annotation.contents);
});

docs.annotation("author", function(){
 return this.annotation.line ? this.annotation.line + "\n" + this.annotation.contents : this.annotation.contents;
});

docs.annotation("note", function(){
 // add regex for `{7} - A note`
 return this.annotation.line;
});

docs.annotation("access", function(){
 return this.annotation.line;
});

docs.annotation("returns", function(){ // return
 return this.annotation.line;
});

docs.annotation("alias", function(){
 return this.annotation.line;
});

docs.annotation("arg", function(){ // argument, param, parameter
 // add regex for {type} name-of-variable [default value] - description
 return this.annotation.line;
});

docs.annotation("type", function(){
 // add regex for {bool, string}
 return this.annotation.line;
});

docs.annotation("todo", function(){
 // add regex for {5} [assignee-one, assignee-two] - Task to be done
 return this.annotation.line;
});

docs.annotation("requires", function(){ // require
 // add regex for {type} item - description
 return this.annotation.line;
});

docs.annotation("state", function(){
 // add regex for modifier - description
 return this.annotation.line;
});

docs.annotation("markup", function(){
 // add regex for {language} [settings] - description
 return this.annotation.contents;
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