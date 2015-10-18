import {info, fs, is, to} from './utils'
import path from 'path'

/// @name parse_file
/// @description
/// Parses a single file
/// @arg {string} - The path to the file you're wanting to parse
/// @returns {array} - Array of parsed blocks
export default function(args = {}) {
  let { file_path, comments, api } = args
  let filetype = path.extname(file_path).replace('.', '') // the filetype of the current file
  let comment = comments[filetype] ? comments[filetype] : comments._
  let annotations = api.list(filetype) // gets the annotations to use on this file
  let annotation_keys = to.keys(annotations) // stores the annotation names for this file in an array
  let file = {} // placeholder to hold the file information that is defined in the return promise
  let debug = {
    get_blocks: {},
    parse_blocks: {}
  }
  debug.get_blocks.self = false;
  debug.get_blocks.result = false;
  debug.parse_blocks.self = false;
  debug.parse_blocks.result = false;

  // @name get_blocks
  // @description Parses the file and returns the comment blocks in an array
  // @returns {array} of the comment blocks
  // @todo {5} - add a line offest argument to this so that you can call parse content on other language types.
  function get_blocks(content, config, restrict = true, start_at = 0) {
    start_at = is.number(start_at) ? start_at : 0;
    let lines = to.array(content)
    let parsed_blocks = []
    let block_info
    let is_start_and_end = is.all.truthy(config.start, config.end)
    let in_comment = false // used to determin that you are in a comment
    let in_code = false // used to determin if you are in the code after the comment block
    // a) The file doesn't contain any header level comments, or body level comments
    if (debug.get_blocks.self) console.log('');
    if (debug.get_blocks.self) console.log('');
    if (debug.get_blocks.self) console.log('');
    if (debug.get_blocks.self) console.log('');
    if (debug.get_blocks.self) console.log('file =', to.json(file));
    if (debug.get_blocks.self) console.log('start_at =', start_at);
    if (debug.get_blocks.self) console.log('starting line =', lines[start_at]);
    if (debug.get_blocks.self) console.log('is_start_and_end =', is_start_and_end);
    if (debug.get_blocks.self) console.log('config.start check =', is.in(file.contents, config.start));
    if (debug.get_blocks.self) console.log('');
    if (debug.get_blocks.self) console.log('test 1:', is.truthy(is_start_and_end) ? !is.in(file.contents, config.start) : !is.in(file.contents, config.line));
    if (debug.get_blocks.self) console.log('test 2:', !is.between(start_at, 0, lines.length - 1));

    if ((is.truthy(is_start_and_end) ? !is.in(file.contents, config.start) : !is.in(file.contents, config.line)) || !is.between(start_at, 0, lines.length - 1)) {
      if (debug.get_blocks.self) console.log('WELL SHIT FIRE, FILE DOESN\'T CONTAIN ANY COMMENTS');
      return [];
    }

    for (let i = start_at, l = lines.length; i < l; i++) {
      let line = lines[i]
      let comment_index = {
            start: is_start_and_end && is.in(line, config.start) ? line.indexOf(config.start) : false,
            line: is.in(line, config.line) ? line.indexOf(config.line) : false,
            end: is_start_and_end && is.in(line, config.end) ? line.indexOf(config.end) : false
          }
      if (debug.get_blocks.self) console.log('line', i, '=', line);
      if (debug.get_blocks.self) console.log('length');
      // a) The line isn't empty so parse it.
      if (!is.empty(line)) {
        // a) is the start and end style or there was an instance of a comment line
        if (is_start_and_end && (!is.false(comment_index.start) || in_comment) || !is.false(comment_index.line)) {
          if (debug.get_blocks.self) console.log('IN COMMENT', '{', 'start:', comment_index.start, ', line:', comment_index.line, ', end:', comment_index.end, '}');

          // a) is the start of a new block
          if (!is.false(comment_index.start) || !is_start_and_end && !in_comment) {
            if (debug.get_blocks.self) console.log('START OF A NEW BLOCK ---------------------------------------------------------------');
            in_code = false;

            // a) There was block that has already been processed
            if (!is.undefined(block_info)) { // holds the current block information
              if (debug.get_blocks.self) console.log('BLOCK WAS PUSHED TO PARSED_BLOCKS');
              block_info.code.end = i - 1; // @todo check to make sure this is correct
              parsed_blocks.push(block_info);

              // Stops the loop after the first comment block
              // has been parsed. This is for file header comments
              if (restrict) {
                if (debug.get_blocks.self) console.log('IS RESTRICTED FIRST INSTANCE !/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!');
                block_info.comment.end = i;
                return parsed_blocks;
              }
            }

            // reset the `block_info` to use on the new block
            block_info = {
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

            in_comment = true;
          }

          // a) check for the end comment
          if (is_start_and_end && block_info.comment.start !== i && !is.false(comment_index.end)) {
            if (debug.get_blocks.self) console.log('LAST LINE IN COMMENT');
            in_comment = false;
            block_info.comment.end = i; // sets the end line in the comment block

            // @todo might need to remove this
            i++; // skips end comment line
            line = lines[i]; // updates to be the next line
            comment_index.end = is.included(config.end); // updates the index

            // comment_index.end = is.in(line, config.end) ? line.indexOf(config.end) : false;
          }

          // a) adds this line to block_info comment contents
          if (in_comment && is.false(comment_index.start) && is.false(comment_index.end)) {
            if (debug.get_blocks.self) console.log('LINE ADDED TO BLOCK COMMENT CONTENTS');
            // a) removes the `config.line` from the line.
            if (!is.false(comment_index.line)) {
              line = line.slice(comment_index.line + config.line.length);
            }

            block_info.comment.contents.push(line);
          }

          // a) check the next line for an instance of the a line comment
          if (!is_start_and_end && !is.in(lines[i + 1], config.line)) {
            if (debug.get_blocks.self) console.log("NEXT 'LINE' IS A COMMENT && NOT START AND END STYLE");
            in_comment = false;
            block_info.comment.end = i; // sets the end line in the comment block
            i++; // skips end comment line // @todo why does this need to be skipped?
            line = lines[i]; // updates to be the next line
          }

          // a) The last line in the file is a commment
          if (in_comment && (is_start_and_end && !is.false(comment_index.end) ? i === l : i === l - 1)) {
            if (debug.get_blocks.self) console.log('LAST LINE IN THE FILE IS A COMMENT');
            block_info.comment.end = is_start_and_end ? i - 1 : i;
            parsed_blocks.push(block_info);
            break; // ensures that the loop stops because it's the last line in the file
          }
        }

        // a) add code to current block_info
        if (!in_comment && is.false(comment_index.end) && !is.undefined(block_info)) {
          // Stops the loop after the first comment block
          // has been parsed. This is for file header comments
          if (restrict) {
            if (debug.get_blocks.self) console.log('IS RESTRICTED SECOND INSTANCE !/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!/!');
            parsed_blocks.push(block_info);
            break;
          }
          if (debug.get_blocks.self) console.log('IN CODE');
          // a) The previous line was a comment
          if (!in_code) {
            if (debug.get_blocks.self) console.log('THE PREVIOUS LINE WAS A COMMENT');
            in_code = true;
            block_info.code.start = i;
          }

          // adds this line to block code contents
          block_info.code.contents.push(line);

          // a) pushes the last block onto the body
          if (i === l - 1) {
            if (debug.get_blocks.self) console.log('LAST LINE IN THE FILE IS CODE');
            block_info.code.end = i;
            parsed_blocks.push(block_info);
          }
        }
      }
      // the last line in the file was an empty line.
      else if (i === l - 1 && is.truthy(block_info)) {
        block_info[is.between(block_info.comment.end) ? 'comment' : 'code'].end = i;
        parsed_blocks.push(block_info);
        if (debug.get_blocks.self) console.log('LINE WAS EMPTY');
      }

      if (debug.get_blocks.self) console.log('');
    } // end loop

    return parsed_blocks;
  }

  // @name this.run_annotation
  // @arg {object} annotation - the information for the annotation to be called(name, line, content, start, end)
  function run_annotation(annotation, block = {}) {
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
        str = str.split('\n');
        return run_annotation({
          name: name,
          line: to.normalize(str[0]),
          contents: str,
          start: null,
          end: null
        });
      }
    }, block);

    // a) add the default annotation function to the object so it can be called in the file specific annotation functions if needed
    if (is.truthy(api.file_list[filetype] && api.file_list[filetype][annotation.name]) && is.truthy(api.file_list.default[annotation.name])) {
      result.default = api.file_list.default[annotation.name].call(result);
    }


    result = annotations[annotation.name].callback.call(result);

    return result;
  }

  // @name parsed_blocks
  // @description
  // Used to parse an array of blocks and runs the annotations function and returns the result
  // @arg {array} - The block/blocks you want to have parsed
  // @returns {array} of parsed blocks
  function parse_blocks(blocks) {
    if (is.empty(blocks)) {
      return []
    }
    // if it's an object then convert it to an array.
    // blocks = to.array(blocks);

    let parsed_blocks = []

    // @name parse_block
    // @description
    // This parses the content passed to it seperates out each annotation
    // parses and figures out the annotation line, and the content after it.
    // Then once it has all the information it calls the annotation function(the annotation one it found)
    // for this file type or the default function.
    // @arg {object} - The blocks to parse
    const parse_block = (block, prefix = comment.prefix, restrict_lines = false) => {
      let contents = to.array(block.comment.contents)
      let block_annotations = {}
      let current = {} // holds the current annotation

      // loop over each line in the comment block
      for (let i = 0, l = contents.length; i < l; i++) {
        let line = contents[i]
        let prefix_index = line.indexOf(prefix)

        // a) there is an index of the annotation prefix
        if (prefix_index >= 0) {
          let first_space = line.indexOf(' ', prefix_index)
          let name_of_annotation = line.slice(prefix_index + 1, first_space >= 0 ? first_space : line.length)

          // a) the name is one of the annotation names
          if (annotation_keys.indexOf(name_of_annotation) >= 0) {
            // a) parse the current annotation
            if (!is.empty(current)) {
              current.end = i - 1

              // run the annotation function and merge it with the other annotations in the block
              to.merge(block_annotations, {
                [current.name]: run_annotation(current, block)
              })
            }

            // redefines resets the current annotation to be blank
            current = {
              name: name_of_annotation, // sets the current annotation name
              line: line.slice(prefix_index + 1 + name_of_annotation.length), // removes the current annotation name and it's prefix from the first line
              contents: [],
              start: i, // sets the starting line of the annotation
              end: 0
            }
          }
        }

        // a) adds the current line to the contents
        if (!is.empty(current) && restrict_lines === false) {
          current.contents.push(line)
        }

        // a) is the last line in the comment block
        if (i === l - 1 && !is.empty(current)) {
          current.end = i
          // run the annotation function and merge it with the other annotations in the block
          to.merge(block_annotations, {
            [current.name]: run_annotation(current, block)
          })
        }
      } // end block loop

      return block_annotations
    }


    // loop over each block
    for (let i in blocks) {
      let block = blocks[i]

      block.comment.contents = to.normalize(block.comment.contents)
      block.code.contents = to.normalize(block.code.contents)

      let parsed_block = parse_block(block)

      if (!is.empty(parsed_block)) {
        parsed_blocks.push(parsed_block)
      }
    } // end blocks loop

    if (debug.parse_blocks.self) console.log('parsed_blocks', parsed_blocks)

    return parsed_blocks;
  };

  return new Promise((resolve, reject) => {
    fs.readFile(file_path)
      .then((contents) => {
        contents = to.normal_string(to.string(contents)); // normalize the file
        file = {
          contents, // all of the contents of the file
          path: path.join(info.dir, path.relative(info.root, file_path)) || file_path, // path of the file
          name: path.basename(file_path, '.' + filetype), // name of the file
          type: filetype, // filetype of the file
          start: 0, // starting point of the file
          end: to.array(contents).length - 1 // ending point of the file
        };

        if (debug.get_blocks.result || debug.parse_blocks.result) {
          console.log('');
          console.log('');
          console.log('');
          console.log('');
        }

        let header = get_blocks(contents, comment.header);

        if (debug.get_blocks.result) {
          console.log('get_blocks(header) =', !is.empty(header) ? header[0].comment.contents : 'no header for this file')
          console.log('')
          console.log('')
        }

        let body = get_blocks(contents, comment.body, false, !is.empty(header) ? header[0].comment.end + 1 : 0)

        if(debug.get_blocks.result) console.log('get_blocks(body) =', body);

        if (debug.parse_blocks.result && debug.parse_blocks.result) {
          console.log('')
          console.log('')
          console.log('')
          console.log('')
        }

        header = parse_blocks(header)[0];

        if (debug.parse_blocks.result) {
          console.log('parse_blocks(header) =', header)
          console.log('')
          console.log('')
        }

        body = parse_blocks(body);

        if (debug.parse_blocks.result) console.log('parse_blocks(body) =', body)

        // removes the contents from the file info because it's
        // not something that is needed in the returned data.
        delete file.contents;

        resolve({
          [file.type]: [{
            info: file,
            header: header || {},
            body
          }]
        })
      })
      .catch((err) => {
        console.log(err);
        reject({});
      });
  })
}