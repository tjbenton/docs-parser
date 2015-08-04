import {info, fs, path, is, to} from "./utils.js";

/// @name parse_file
/// @description
/// Parses a single file
/// @arg {string} - The path to the file you're wanting to parse
/// @returns {array} - Array of parsed blocks
export default function(file_path, setting, _annotation){
 let filetype = path.extname(file_path).replace(".", ""), // the filetype of the current file
     annotations = _annotation.list(filetype), // gets the annotations to use on this file
     annotation_keys = to.keys(annotations), // stores the annotation names for this file in an array
     contents = to.normal_string(to.string(fs.readFileSync(file_path))), // the contents of the file
     lines = to.array(contents), // all the lines in the file
     file = {
      contents, // all of the contents of the file
      path: path.join(info.dir, path.relative(info.root, file_path)) || file_path, // path of the file
      name: path.basename(file_path, "." + filetype), // name of the file
      type: filetype, // filetype of the file
      start: 0, // starting point of the file
      end: lines.length - 1 // ending point of the file
     };

 let debug = {};
 debug.get_blocks = true;

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


 // @name get_blocks
 // @description Parses the file and returns the comment blocks in an array
 // @returns {array} of the comment blocks
 // @todo {5} - add a line offest argument to this so that you can call parse content on other language types.
 const get_blocks = (config, restrict = true, start_at = 0) => {
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
  // debug.get_blocks && console.log("file =", to.json(file));
  debug.get_blocks && console.log("start_at =", start_at);
  debug.get_blocks && console.log("starting line =", lines[start_at]);
  debug.get_blocks && console.log("is_start_and_end =", is_start_and_end);
  debug.get_blocks && console.log("config.start check =", is.included(file.contents, config.start));
  debug.get_blocks && console.log("config.line check =", is.included(file.contents, config.line));
  debug.get_blocks && console.log("");
  debug.get_blocks && console.log("test 1:", is.truthy(is_start_and_end) && is.in(file.contents, config.start));
  debug.get_blocks && console.log("test 2:", is.all.falsy(is_start_and_end, is.in(file.contents, config.line)));
  debug.get_blocks && console.log("test 3:", !is.between(start_at, 0, lines.length - 1));
  debug.get_blocks && console.log("test 4:", (is.truthy(is_start_and_end) && is.false(is.included(file.contents, config.start))) || (is.falsy(is_start_and_end) && is.false(is.included(file.contents, config.line))) || !is.between(start_at, 0, lines.length - 1));

  if(is.truthy(is_start_and_end) && is.in(file.contents, config.start) || is.all.falsy(is_start_and_end, is.in(file.contents, config.line)) || !is.between(start_at, 0, lines.length - 1)){
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
   debug.get_blocks && console.log("length");
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
     debug.get_blocks && console.log("IN CODE");
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
 },

 // @name parse_blocks
 // @description Parse the blocks that're returned from `get_blocks`
 // @returns {array}
 parse_blocks = function(){
  // @name this.call_annotation
  // @arg {object} annotation - the information for the annotation to be called(name, line, content, start, end)
  this.call_annotation = (annotation) => {
   // removes the first line because it's the "line" of the annotation
   annotation.contents.shift();

   // normalizes the current annotation contents
   annotation.contents = to.normalize(annotation.contents);

   // normalizes the current annotation line
   annotation.line = to.normalize(annotation.line);

   // Merges the data together so it can be used to run all the annotations
   let result = to.extend({
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
             line: to.normalize(str[0]),
             contents: str,
             start: null,
             end: null
            });
    }
   }, !is.undefined(this.block) ? this.block : {});

   // a) add the default annotation function to the object so it can be called in the file specific annotation functions if needed
   if(is.truthy(_annotation.file_list[filetype] && _annotation.file_list[filetype][annotation.name]) && is.truthy(_annotation.file_list.default[annotation.name])){
    result.default = _annotation.file_list.default[annotation.name].call(result);
   }


   result = annotations[annotation.name].callback.call(result);

   // run the annotation function and merge it with the other annotations in the block
   to.merge(this.block_annotations, {
    [annotation.name]: result
   });
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
     this.block = blocks[a];
     this.block_annotations = {};

     this.block.comment.contents = to.normalize(this.block.comment.contents);
     this.block.code.contents = to.normalize(this.block.code.contents);

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

  return parsed_blocks;
 };

 let result = {};


 result.header = get_blocks(setting.file_comment);
 debug.get_blocks && console.log("result.header =", !is.empty(result.header) && result.header[0].comment.contents);
 debug.get_blocks && console.log("");
 debug.get_blocks && console.log("");
 result.body = get_blocks(setting.block_comment, false, !is.empty(result.header) && result.header[0].comment.end + 1);
 debug.get_blocks && console.log("result.body =", result.body);

 return parse_blocks.call(result);
};
