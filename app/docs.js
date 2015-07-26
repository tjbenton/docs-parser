"use strict";

import markdown from "marked";
import {Deferred, fs, path, is, to, extend, normalize} from "./utils.js";
import paths from "./paths.js";

////
/// @name docs.js
/// @author Tyler Benton
/// @description
/// This is used to parse any filetype that you want to and gets the documentation for it and returns an {} of the document data
////
var docs = (function(){

 // Stores the project directory to use later
 let __project_dir = process.cwd(),
    project_dir = __project_dir.split(path.sep); // splits the project dir by the system specific delimiter
 project_dir = project_dir[project_dir.length - 1]; // gets the working directory

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
        markdown,
        normalize,
        extend,
        to,
        is,
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
 // _.file_specific_settings.coffee = _.file_specific_settings.rb;

 /// @name settings
 /// @description Merges the default settings with the file specific settings
 /// @arg {string} filetype - the current filetype that is being parsed
 /// @returns {object} the settings to use
 _.settings = filetype => {
  let defaults = {
   file_comment: { // file level comment block identifier
    start: "////",
    line: "///",
    end: "////"
   },
   block_comment: { // block level comment block identifier
    start: "",
    line: "///",
    end: ""
   },
   annotation_prefix: "@", // annotation identifier(this should probably never be changed)
   single_line_prefix: "#" // single line prefix for comments inside of the code below the comment block
  };
  return !is.undefined(_.file_specific_settings[filetype]) ? extend(defaults, _.file_specific_settings[filetype]) : defaults;
 };

 /// @name setting
 /// @description Allows you to specify settings for specific file types
 /// @arg {string} extention - the file extention you want to target
 /// @arg {object} obj - the settings you want to adjust for this file type
 _.setting = (extention, obj) => {
  return extend(_.file_specific_settings, {
   [extention]: obj
  });
 };

 // the annotations object
 _.all_annotations = {};

 /// @name annotations
 /// @description
 /// This gets the annotations to use for the current filetype.
 /// Basically the file specific annotations get extended onto the default annotations
 /// @arg {string} filetype - the current filetype that is being parsed
 /// @returns {object} the settings to use
 _.annotations = filetype => !is.undefined(_.all_annotations[filetype]) ? extend(extend({}, _.all_annotations.default), _.all_annotations[filetype]) : _.all_annotations.default;

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
   extend(_.all_annotations, {
    [item]: extend(_.all_annotations[item] || {}, {
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
  let filetype = path.extname(file_path).replace(".", ""), // the filetype of the current file
      setting = _.settings(filetype), // gets the settings for this file
      annotations = _.annotations(filetype), // gets the annotations to use on this file
      annotation_keys = Object.getOwnPropertyNames(annotations), // stores the annotation names for this file in an array
      // The ` + ""` converts the file from a buffer to a string
      //
      // The `replace` fixes a extremily stupid issue with strings, that is caused by shitty microsoft computers.
      // It removes`\r` and replaces it with `\n` from the end of the line. If this isn't here then when `match`
      // runs it will return 1 more item in the matched array than it should(in the normalize function)
      // http://stackoverflow.com/questions/20023625/javascript-replace-not-replacing-text-containing-literal-r-n-strings
      // contents = (fs.readFileSync(file_path) + "").replace(/(?:\\[rn]|[\r\n]+)+/g, "\n"),
      // @todo - this needs to be updated because the replace function above removes ALLLLLL empty lines and tha throws off the start and end file output
      contents = (fs.readFileSync(file_path) + "").replace(/(?:\\[rn]+)+/g, "\n"),
      lines = to.array(contents), // all the lines in the file
      file = {
       contents, // all of the contents of the file
       path: path.join(project_dir, path.relative(__project_dir, file_path)) || file_path, // path of the file
       name: path.basename(file_path, "." + filetype), // name of the file
       type: filetype, // filetype of the file
       start: 0, // starting point of the file
       end: lines.length - 1 // ending point of the file
      };

  // @name get_blocks
  // @description Parses the file and returns the comment blocks in an array
  // @returns {array} of the comment blocks
  const get_blocks = () => {
   // @name new_block
   // @description Used to create new placeholder for each block
   // @arg {number} i - The start line of the comment block
   // @returns {object}
   const new_block = i => {
    return {
     comment: {
      contents: [],
      start: i,
      end: -1
     },
     code: {
      contents: [],
      start: -1,
      end: -1
     },
     file
    };
   };

   let debug = {};
   debug.get_blocks = false;

   // @todo {5} - add a line offest argument to this so that you can call parse content on other language types.
   const parse_content = (config, restrict = true, start_at = 0) => {
    start_at = is.number(start_at) ? start_at : 0;
    let parsed_blocks = [],
        block_info,
        is_start_and_end = is.truthy(config.start) && is.truthy(config.end),
        in_comment = false, // used to determin that you are in a comment
        in_code = false; // used to determin if you are in the code after the comment block
    // a) The file doesn't contain any header level comments, or body level comments
    debug.get_blocks && console.log("");
    debug.get_blocks && console.log("");
    debug.get_blocks && console.log("");
    debug.get_blocks && console.log("");
    debug.get_blocks && console.log("file =", JSON.stringify(file, null, 2));
    debug.get_blocks && console.log("start_at =", start_at);
    debug.get_blocks && console.log("starting line =", lines[start_at]);
    debug.get_blocks && console.log("is_start_and_end =", is_start_and_end);
    debug.get_blocks && console.log("config.start check =", is.included(file.contents, config.start));
    debug.get_blocks && console.log("config.line check =", is.included(file.contents, config.line));
    debug.get_blocks && console.log("");

    if((is.truthy(is_start_and_end) && is.false(is.included(file.contents, config.start)) ||
        is.falsy(is_start_and_end) && is.false(is.included(file.contents, config.line))) ||
        is.between(start_at, 0, lines.length - 1) ){
     debug.get_blocks && console.log("WELL SHIT FIRE, FILE DOESN'T CONTAIN ANY COMMENTS");
     return [];
    }

    for(let i = start_at, l = lines.length; i < l; i++){
     let line = lines[i],
         comment_index = {
          start: is_start_and_end ? is.included(line, config.start) : false,
          line: is.included(line, config.line),
          end: is_start_and_end ? is.included(line, config.end) : false
         };
     debug.get_blocks && console.log("line", i, "=", line);
     debug.get_blocks && console.log("length")
     // a) The line isn't empty so parse it.
     if(!is.empty(line)){
      // a) is the start and end style or there was an instance of a comment line
      if(is_start_and_end && (!is.false(comment_index.start) || in_comment) || !is.false(comment_index.line)){
       debug.get_blocks && console.log("IN COMMENT", "{", "start:", comment_index.start, ", line:", comment_index.line, ", end:", comment_index.end, "}");

       // a) is the start of a new block
       if(!is.false(comment_index.start) || !is_start_and_end && !in_comment){
        debug.get_blocks && console.log("START OF A NEW BLOCK ---------------------------------------------------------------");
        in_code = false;

        // a) There was block that has already been processed
        if(!is.undefined(block_info)){ // holds the current block information
         debug.get_blocks && console.log("BLOCK WAS PUSHED TO PARSED_BLOCKS");
         // console.log("BLOCK INFO IS NOT UNDEFINED =", block_info);

         block_info.code.end = i - 1; // @todo check to make sure this is correct
         parsed_blocks.push(block_info);

         // Stops the loop after the first comment block
         // has been parsed. This is for file header comments
         if(restrict){
          debug.get_blocks && console.log("IS RESTRICTED FIRST INSTANCE !/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!");
          block_info.comment.end = i;
          return parsed_blocks;
         }
        }

        // reset the `block_info` to use on the new block
        block_info = new_block(i);

        in_comment = true;
       }

       // a) check for the end comment
       if(is_start_and_end && block_info.comment.start !== i && !is.false(comment_index.end)){
        debug.get_blocks && console.log("LAST LINE IN COMMENT");
        in_comment = false;
        block_info.comment.end = i; // sets the end line in the comment block

        // @todo might need to remove this
        i++; // skips end comment line
        line = lines[i]; // updates to be the next line
        comment_index.end = is.included(config.end); // updates the index
       }

       // a) adds this line to block_info comment contents
       if(in_comment && is.false(comment_index.start) && is.false(comment_index.end)){
        debug.get_blocks && console.log("LINE ADDED TO BLOCK COMMENT CONTENTS");
        // a) removes the `config.line` from the line.
        if(!is.false(comment_index.line)){
         line = line.slice(comment_index.line + config.line.length);
        }

        block_info.comment.contents.push(line);
       }

       // a) check the next line for an instance of the a line comment
       if(!is_start_and_end && is.false(is.included(lines[i + 1], config.line))){
        debug.get_blocks && console.log("NEXT 'LINE' IS A COMMENT && NOT START AND END STYLE");
        in_comment = false;
        block_info.comment.end = i; // sets the end line in the comment block
        i++; // skips end comment line // @todo why does this need to be skipped?
        line = lines[i]; // updates to be the next line
       }

       // a) The last line in the file is a commment
       if(in_comment && (is_start_and_end && !is.false(comment_index.end) ? i === l : i === l - 1)){
        debug.get_blocks && console.log("LAST LINE IN THE FILE IS A COMMENT");
        block_info.comment.end = is_start_and_end ? i - 1 : i;
        parsed_blocks.push(block_info);
        break; // ensures that the loop stops because it's the last line in the file
       }
      }

      // a) add code to current block_info
      if(!in_comment && is.false(comment_index.end) && !is.undefined(block_info)){
       // Stops the loop after the first comment block
       // has been parsed. This is for file header comments
       if(restrict){
        debug.get_blocks && console.log("IS RESTRICTED SECOND INSTANCE !/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!");
        parsed_blocks.push(block_info);
        break;
       }
       debug.get_blocks && console.log("IN CODE")
       // a) The previous line was a comment
       if(!in_code){
        debug.get_blocks && console.log("THE PREVIOUS LINE WAS A COMMENT");
        in_code = true;
        block_info.code.start = i;
       }

       // adds this line to block code contents
       block_info.code.contents.push(line);

       // a) pushes the last block onto the body
       if(i === l - 1){
        debug.get_blocks && console.log("LAST LINE IN THE FILE IS CODE");
        block_info.code.end = i;
        parsed_blocks.push(block_info);
       }
      }
     }
     // the last line in the file was an empty line.
     else if(i === l - 1 && is.truthy(block_info)){
      block_info[is.between(block_info.comment.end) ? "comment" : "code"].end = i;
      parsed_blocks.push(block_info);
      debug.get_blocks && console.log("LINE WAS EMPTY");
     }

     debug.get_blocks && console.log("");
    } // end loop

    return parsed_blocks;
   };

   let header = [],
       body = [];

   debug.get_blocks && console.log("");
   debug.get_blocks && console.log("");
   debug.get_blocks && console.log("");
   debug.get_blocks && console.log("");
   debug.get_blocks && console.log("");
   // lines = lines.slice(header.comment.end);
   header = parse_content(setting.file_comment);
   debug.get_blocks && console.log("header =", !is.empty(header) && header[0].comment.contents);
   debug.get_blocks && console.log("");
   debug.get_blocks && console.log("");
   body = parse_content(setting.block_comment, false, !is.empty(header) && header[0].comment.end + 1);
   debug.get_blocks && console.log("body =", body);

   return {
    header, // the header for the file
    body // the blocks in the rest of the file
   };
  };

  // @name parse_blocks
  // @description Parse the blocks that're returned from `get_blocks`
  // @returns {array}
  const parse_blocks = function(){
   // @name this.call_annotation
   // @arg {object} annotation - the information for the annotation to be called(name, line, content, start, end)
   this.call_annotation = (annotation) => {
    let name = annotation.name,
        to_call;

    // removes the first line because it's the "line" of the annotation
    annotation.contents.shift();

    // normalizes the current annotation contents
    annotation.contents = _.normalize(annotation.contents);

    // normalizes the current annotation line
    annotation.line = _.normalize(annotation.line);

    // Merges the data together so it can be used to run all the annotations
    to_call = extend({
     annotation: annotation, // sets the annotation block information to be in it's own namespace of `annotation`

     /// @name this.add
     /// @page annotation
     /// @description Allows you to add a different annotation from within a annotation
     /// @arg {string} name - the name of the annotation you want to add
     /// @arg {string} str - information that is passed to the annotation
     add: (name, str) => {
      str = str.split("\n");
      return this.call_annotation({
              name: name,
              line: _.normalize(str[0]),
              contents: str,
              start: null,
              end: null
             });
     }
    }, !is.undefined(this.block) ? this.block : {});

    // a) add the default annotation function to the object so it can be called in the file specific annotation functions if needed
    if(!is.undefined(_.all_annotations[this.block.file.type]) && !is.undefined(_.all_annotations[this.block.file.type][name])){
     extend(to_call, {
      default: () => _.all_annotations.default[name].call(to_call)
     });
    }
    // run the annotation function and merge it with the other annotations in the block
    return this.merge(name, annotations[name].call(to_call));
   }

   // @name this.merge
   // @description
   // This merges a single annotation with the other annotations in the current block(`this.block_annotations`).
   //
   // If the annotation(`name`) **doesn't** exist then it adds it.
   //
   // If the annotation(`name`) **does** exist
   //  - If it **isn't** an `Array` then it converts the current value to an
   //    array and adds the new item to that array.
   //  - If it's already an array then it pushes `to_merge` onto it.
   //
   // @arg {string} name - Name of the annotation to merge
   // @arg {*} to_merge - The result from calling the annotation.
   // @returns {object} - `this.block_annotations`
   this.merge = (name, to_merge) => {
    // a) the current item being merged is already defined in the base
    // b) define the target
    if(!is.undefined(this.block_annotations[name])){
     // a) convert the target to an array
     // b) add item to the current target array
     if(!is.array(this.block_annotations[name])){
      this.block_annotations[name] = [this.block_annotations[name], to_merge];
     }else{
      this.block_annotations[name].push(to_merge);
     }
    }else{
     this.block_annotations[name] = to_merge;
    }

    return this.block_annotations;
   };

   // @name this.parse
   // @description
   // Used to parse an array of blocks and runs the annotations function and returns the result
   // @arg {object, array} - The block/blocks you want to have parsed
   // @returns {array} of parsed blocks
   this.parse = blocks_to_parse => {
    let _parse_blocks,
        _parse_content;

    _parse_blocks = (blocks = blocks_to_parse) => {
     let parsed_blocks = [];

      // if it's an object then convert it to an array.
     blocks = to.array(blocks);

     // loop over each block
     for(let a = 0, blocks_length = blocks.length; a < blocks_length; a++){
      this.block = blocks[a]
      this.block_annotations = {};

      this.block.comment.contents = _.normalize(this.block.comment.contents);
      this.block.code.contents = _.normalize(this.block.code.contents);

      let parsed_block = _parse_content(this.block.comment.contents);

      if(!is.empty(this.block_annotations)){
       parsed_blocks.push(this.block_annotations);
      }
     } // end blocks loop

     return parsed_blocks;
    };

    // @name _parse_content
    // @description
    // This parses the content passed to it seperates out each annotation
    // parses and figures out the annotation line, and the content after it.
    // Then once it has all the information it calls the annotation function(the annotation one it found)
    // for this file type or the default function.
    // @arg {string, array} - The contents to loop over
    _parse_content = (contents, prefix = setting.annotation_prefix, restrict_lines = false) => {
     contents = to.array(contents);

     let current_annotation = {}; // holds the current annotation

     // loop over each line in the comment block
     for(let i = 0, l = contents.length; i < l; i++){
      let line = contents[i],
          prefix_index = line.indexOf(prefix);

      // a) there is an index of the annotation prefix
      if(prefix_index >= 0){
       let first_space = line.indexOf(" ", prefix_index),
           name_of_annotation = line.slice(prefix_index + 1, first_space >= 0 ? first_space : line.length);

       // a) the name is one of the annotation names
       if(annotation_keys.indexOf(name_of_annotation) >= 0){
        // a) parse the current annotation
        if(!is.empty(current_annotation)){
         current_annotation.end = i - 1;
         this.call_annotation(current_annotation);
        }

        // redefines resets the current annotation to be blank
        current_annotation = {
         name: name_of_annotation, // sets the current annotation name
         line: line.slice(prefix_index + 1 + name_of_annotation.length), // removes the current annotation name and it's prefix from the first line
         contents: [],
         start: i, // sets the starting line of the annotation
         end: 0
        };
       }
      }

      // a) adds the current line to the contents
      if(!is.empty(current_annotation) && restrict_lines === false){
       current_annotation.contents.push(line);
      }

      // a) is the last line in the comment block
      if(i === l - 1 && !is.empty(current_annotation)){
       current_annotation.end = i;
       this.call_annotation(current_annotation);
      }
     } // end block loop

     return current_annotation;
    };

    return _parse_blocks();
   };

   // parses the file and gets the results
   let file_annotations = !is.empty(this.header) ? this.parse(this.header)[0] : false,
       parsed_blocks = this.parse(this.body);

   // a) loop over each parsed blocks and set the file level annotations
   // @todo {5} - remove this so code doesn't get duplicated.
   if(!is.false(file_annotations)){
    let _blocks = [];
    for(let i = 0, l = parsed_blocks.length; i < l; i++){
     _blocks.push(extend(extend({}, file_annotations), parsed_blocks[i]));
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