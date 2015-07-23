"use strict";

import markdown from "marked";
import {Deferred, fs, path, glob, is} from "./utils.js";
import paths from "./paths.js";

////
/// @name docs.js
/// @author Tyler Benton
/// @description
/// This is used to parse any filetype that you want to and gets the documentation for it and returns an {} of the document data
////
var docs = (function(){
 // the main object to return
 // a small object to help with reading and writing the temp data.
 const root = process.cwd() + "/",
       temp_file = path.join(root, ".tmp/data.json"),
       temp_data = {
        get(){
         let def = new Deferred();

         // a) Create `temp_file`
         // b) Resolve with data from `temp_file`
         fs.readJson(temp_file, (err, data) => err ? fs.outputJson(temp_file, {}, () => def.resolve({})) : def.resolve(data));

         return def.promise();
        },
        write(data){
         fs.writeJson(temp_file, data, (err) => err && console.error(err));
        }
       },
       _ = {
        /// @name markdown
        /// @description
        /// Helper function to convert markdown text to html
        /// For more details on how to use marked [see](https://www.npmjs.com/package/marked)
        markdown
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
  },
  rb: {
   file_comment: {
    start: "###",
    line: "##",
    end: "###"
   },
   block_comment: {
    line: "##"
   }
  },
  html: {
   file_comment: {
    start: "<!----",
    end: "/--->"
   },
   block_comment: {
    start: "<!---",
    end: "/-->"
   }
  },
  cfm: {
   file_comment: {
    start: "<!-----",
    end: "/--->"
   },
   block_comment: {
    start: "<!----",
    end: "/--->"
   }
  }
 }
 _.file_specific_settings.py = _.file_specific_settings.rb;

 /// @name extend
 /// @description
 /// Extend object `b` onto `a`
 /// http://jsperf.com/deep-extend-comparison
 /// @arg {object} a - Source object.
 /// @arg {object} b - Object to extend with.
 /// @returns {object} The extended object.
 _.extend = (a, b) => {
  // Don't touch 'null' or 'undefined' objects.
  if(!a || !b){
   return a;
  }

  for(let i = 0, keys = Object.keys(b), l = keys.length; i < l; i++){
   let key = keys[i];

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

 /// @name settings
 /// @description Merges the default settings with the file specific settings
 /// @arg {string} filetype - the current filetype that is being parsed
 /// @returns {object} the settings to use
 _.settings = filetype => {
  let defaults = {
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
  }
  return !is.undefined(_.file_specific_settings[filetype]) ? _.extend(defaults, _.file_specific_settings[filetype]) : defaults;
 }

 /// @name setting
 /// @description Allows you to specify settings for specific file types
 /// @arg {string} extention - the file extention you want to target
 /// @arg {object} obj - the settings you want to adjust for this file type
 _.setting = (extention, obj) => {
  return _.extend(_.file_specific_settings, {
   [extention]: obj
  });
 }

 // the annotations object
 _.all_annotations = {};

 /// @name annotations
 /// @description
 /// This gets the annotations to use for the current filetype.
 /// Basically the file specific annotations get extended onto the default annotations
 /// @arg {string} filetype - the current filetype that is being parsed
 /// @returns {object} the settings to use
 _.annotations = filetype => !is.undefined(_.all_annotations[filetype]) ? _.extend(_.extend({}, _.all_annotations.default), _.all_annotations[filetype]) : _.all_annotations.default;

 /// @name normalize
 /// @description
 /// Removes extra whitespace before all the lines that are passed
 /// Removes all whitespace at the end of each line
 /// Removes trailing blank lines
 /// @arg {array, string} content - The array of lines that will be normalized
 /// @returns {string} - The normalized string
 _.normalize = content => {
  content = is.string(content) ? content.split("\n") : content; // this allows arrays and strings to be passed

  // remove trailing blank lines
  for(let i = content.length; i-- && content[i].length === 0; content.pop());

  return content
          .map(line => line.slice(
           content.join("\n") // converts content to string to string
            .match(/^\s*/gm) // gets the extra whitespace at the begining of the line and returns a map of the spaces
            .sort((a, b) => a.length - b.length)[0].length; // sorts the spaces array from smallest to largest and then checks returns the length of the first item in the array
          )) // remove extra whitespace from the begining of each line
          .join("\n").replace(/[^\S\r\n]+$/gm, ""); // convert to string and remove all trailing white spaces
 };

 /// @name annotation
 /// @description Used to define the new annotations
 /// @arg {string} name - The name of the variable
 /// @arg {object} obj - The callback to be executed at parse time
 _.annotation = (name, obj) => {
  if(is.function(obj)){
   obj = {
    default: obj
   };
  }

  for(var item in obj){
   _.extend(_.all_annotations, {
    [item]: _.extend(_.all_annotations[item] || {}, {
     [name]: obj[item]
    })
   });
  }
 }


 /// @name parse_file
 /// @description
 /// Parses a single file
 /// @arg {string} - The path to the file you're wanting to parse
 /// @returns {array} - Array of parsed blocks
 _.parse_file = file_path => {
  let get_blocks,
      parse_blocks,
      filetype = path.extname(file_path).replace(".", ""),
      setting = _.settings(filetype),
      annotations = _.annotations(filetype),
      annotation_keys = Object.getOwnPropertyNames(annotations),

      // The ` + ""` converts the file from a buffer to a string
      //
      // The `replace` fixes a extremily stupid issue with strings, that is caused by shitty microsoft computers.
      // It removes`\r` and replaces it with `\n` from the end of the line. If this isn't here then when `match`
      // runs it will return 1 more item in the matched array than it should(in the normalize function)
      // http://stackoverflow.com/questions/20023625/javascript-replace-not-replacing-text-containing-literal-r-n-strings
      file = (fs.readFileSync(file_path) + "").replace(/(?:\\[rn]|[\r\n]+)+/g, "\n"),
      _obj = {
       file: {
        contents: file,
        path: file_path,
        type: filetype,
        start: 0,
        end: file.split("\n").length - 1
       }
      };

  // @name get_blocks
  // @description Parses the file and returns the comment blocks in an array
  // @returns {array} of the comment blocks
  get_blocks = () => {
   // @name new_block
   // @description Used to create new placeholder for each block
   // @arg {number} i - The start line of the comment block
   // @returns {object}
   const new_block = i => {
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

   let _blocks = [], // holds all the blocks
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
     let line = lines[i],
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
    let line = lines[i],
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

  // @name parse_blocks
  // @description Parses each block in blocks
  // @returns {array}
  parse_blocks = function(){
   // @name this.merge
   // @description Used as a helper function because this action is performed in two spots
   // @arg {object} annotation - information of the current annotation block
   // @arg {object} info - information about the current comment block, the code after the comment block and the full file contents
   // @returns {object}
   this.merge = (annotation, info) => {
    let name = annotation.name,
        to_call,
        to_extend;

    // removes the first line because it's the "line" of the annotation
    annotation.contents.shift();

    // normalizes the current annotation block contents
    annotation.contents = _.normalize(annotation.contents);


    // Merges the data together so it can be used to run all the annotations
    to_call = _.extend({
     annotation: annotation, // sets the annotation block information to be in it's own namespace of `annotation`

     /// @name this.add
     /// @page annotation
     /// @description Allows you to add a different annotation from within a annotation
     /// @arg {string} name - the name of the annotation you want to add
     /// @arg {string} str - information that is passed to the annotation
     add: (name, str) => {
      str = str.split(/\n/);
      return this.merge({
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
      default: () => _.all_annotations.default[name].call(to_call)
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

   // @name this.parse
   // @description
   // Used to parse an array of blocks and runs the annotations function and returns the result
   // @arg {object, array} - The block/blocks you want to have parsed
   // @returns {array} of parsed blocks
   this.parse = blocks => {
    let parsed_blocks = [];

    // if it's an object then convert it to an array.
    blocks = is.object(blocks) ? [blocks] : is.array(blocks) ? blocks : [];

    // loop over each block
    for(let a = 0, blocks_length = blocks.length; a < blocks_length; a++){
     let block = blocks[a],
         comment = block.comment.contents,
         _annotation = {};

     this.annotations_in_block = {};

     block.comment.contents = _.normalize(block.comment.contents);
     block.code.contents = _.normalize(block.code.contents);

     // loop over each line in the comment block
     for(let i = 0, l = comment.length; i < l; i++){
      let line = comment[i],
          prefix_index = line.indexOf(setting.annotation_prefix);

      // a) there is an index of the annotation prefix
      if(prefix_index >= 0){
       let first_space = line.indexOf(" ", prefix_index),
           name_of_annotation = line.slice(prefix_index + 1, first_space >= 0 ? first_space : line.length);

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
         line: line.slice(prefix_index + 1 + name_of_annotation.length), // removes the current annotation name and it's prefix from the first line
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
      if(i === l - 1 && !is.empty(_annotation)){
       _annotation.end = i;
       parsed_blocks.push(this.merge(_annotation, block));
      }
     } // end block loop
    } // end blocks loop

    return parsed_blocks;
   };

   // parses the file and gets the results
   let file_annotations = !is.empty(this.file) ? this.parse(this.file)[0] : false,
       parsed_blocks = this.parse(this.general);

   // a) loop over each parsed blocks and set the file level annotations
   if(!is.false(file_annotations)){
    let _blocks = [];
    for(let i = 0, l = parsed_blocks.length; i < l; i++){
     _blocks.push(_.extend(_.extend({}, file_annotations), parsed_blocks[i]));
    }
    parsed_blocks = _blocks;
   }

   return parsed_blocks;
  };

  return parse_blocks.call(get_blocks());
 };

 /// @name parse
 /// @description Takes the contents of a file and parses it
 /// @arg {string, array} files - file paths to parse
 /// @arg {boolean} changed [true] - If true it will only parse changed files
 /// @returns {object} - the data that was parsed
 _.parse = (files, changed) => {
  let def = new Deferred();
  Deferred.when.all([paths(files, changed), temp_data.get()])
   .done(deferreds => {
    let file_paths = deferreds[0],
        json = deferreds[1];
    // loops over all the files that return
    for(let i = 0, l = file_paths.length; i < l; i++){
     let file_path = file_paths[i],
         filetype = path.extname(file_path).replace(".", ""),
         parsed_data = _.parse_file(file_path);

     // temp data stuff ------------------------------------------------------------

     // a) if the current block is undefined in the json objected then create it
     if(is.undefined(json[filetype])){
      json[filetype] = {};
     }

     // a) creates array for the filepath
     if(is.undefined(json[filetype][file_path])){
      json[filetype][file_path] = [];
     }

     // merges the existing array with the new blocks arrays
     json[filetype][file_path].push.apply(json[filetype][file_path], parsed_data);
    }

    // updates the temp file
    temp_data.write(json);

    def.resolve({
     /// @name parse().data
     /// @description Placeholder for the data so if it's manipulated the updated data will be in the other functions
     data: json,

     /// @name parse().write
     /// @description Helper function to write out the data to a json file
     /// @arg {string} location - The location to write the file too
     /// @arg {number,\t,\s} spacing [1] - The spacing you want the file to have.
     /// @returns {this}
     write(location, spacing){
      fs.writeJson(temp_file, this.data, (err) => err && console.error(err));
      return this;
     },

     // @todo {tylerb} - Add a way to documentize the files
     // This should be apart of it's own code base so it doesn't pollute this one.
     // @returns {this}
     documentize(){
      console.log("documentize");
     }
    });
   });

  return def.promise();
 };

 return _;
})();

// base annotations

/// @name name
/// @page annotations
/// @description Name of the documented item
/// @returns {string}
docs.annotation("name", function(){
 return this.annotation.line;
});

/// @name page
/// @page annotations
/// @description The page you want the documented item to be on
/// @returns {string}
docs.annotation("page", function(){ // group
 return this.annotation.line;
});

/// @name author
/// @page annotations
/// @description A note about the documented item
docs.annotation("author", function(){
 return this.annotation.line || this.annotation.contents;
});

/// @name description
/// @page annotations
/// @description Description of the documented item
/// @note Runs through markdown
/// @returns {string}
docs.annotation("description", function(){
 console.log(this.annotation.contents);
 return docs.markdown(this.annotation.line ? this.annotation.line + "\n" + this.annotation.contents : this.annotation.contents);
});

/// @name note
/// @page annotations
/// @description A note about the documented item
/// @returns {object}
docs.annotation("note", function(){
 // add regex for `{7} - A note`
 return this.annotation.line;
});

/// @name access
/// @page annotations
/// @description Access of the documented item
/// @returns {string}
docs.annotation("access", function(){
 return this.annotation.line;
});

/// @name alias
/// @page annotations
/// @description Whether the documented item is an alias of another item
/// @returns {string}
docs.annotation("alias", function(){
 return this.annotation.line;
});

/// @name returns
/// @page annotations
/// @description Return from the documented function
/// @returns {string}
docs.annotation("returns", function(){ // return
 // add regex for `{type} - description`. Also ensure it supports multiple lines
 return this.annotation.line;
});

/// @name arg
/// @page annotations
/// @description Parameters from the documented function/mixin
/// @note Description runs through markdown
/// @returns {object}
docs.annotation("arg", function(){ // argument, param, parameter
 // add regex for `{type} name-of-variable [default value] - description`
 // make sure it supports multiple lines
 return this.annotation.line;
});

/// @name type
/// @page annotations
/// @description Describes the type of a variable
/// @returns {string}
docs.annotation("type", function(){
 // add regex for `{type} - description`
 return this.annotation.line;
});

/// @name deprecated
/// @page annotations
/// @description Lets you know that a mixin/function has been depricated
/// @returns {string}
docs.annotation("deprecated", function(){
 // add regex for `{version} - description`
 return this.annotation.line;
});

/// @name chainable
/// @page annotations
/// @description Used to notate that a function is chainable
/// @returns {boolean}
docs.annotation("chainable", function(){
 return true;
});

/// @name readonly
/// @page annotations
/// @description To note that a property is readonly
/// @returns {boolean}
docs.annotation("readonly", function(){
 return true;
});

/// @name constructor
/// @page annotations
/// @description Describes the type of a variable
/// @returns {boolean}
docs.annotation("constructor", function(){
 return true;
});

/// @name version
/// @page annotations
/// @description Describes the type of a variable
/// @returns {string}
docs.annotation("version", function(){
 // add regex for `{type} - description`
 return this.annotation.line;
});

/// @name todo
/// @page annotations
/// @description Things to do related to the documented item
/// @returns {object}
docs.annotation("todo", function(){
 // add regex for {5} [assignee-one, assignee-two] - Task to be done
 // make sure it supports multiple lines
 return this.annotation.line;
});

/// @name requires
/// @page annotations
/// @description Requirements from the documented item
/// @returns {object}
docs.annotation("requires", function(){ // require
 // add regex for {type} item - description
 return this.annotation.line;
});

/// @name state
/// @page annotations
/// @description A state of a the documented item
/// @returns {object}
docs.annotation("state", function(){
 // add regex for `modifier - description`
 // should consider supporting multiple lines
 // should `modifier` change to be `{modifier}` since it's sorta like `type`?
 return this.annotation.line;
});

/// @name markup
/// @page annotations
/// @description Code for the documented item
/// @note Description is parsed as markdown
/// @returns {object}
docs.annotation("markup", function(){
 // add regex for `{language} [settings] - description`
 return this.annotation.contents;
});



export default docs;