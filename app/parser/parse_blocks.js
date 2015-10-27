import { is, to } from '../utils'
import autofill from './autofill'

// @name parsed_blocks
// @access private
// @description
// Used to parse an array of blocks and runs the annotations function and returns the result
// @arg {array} - The block/blocks you want to have parsed
// @returns {array} of parsed blocks
export default function parse_blocks(options = {}) {
  let {
    file,
    blocks,
    annotations,
    comment,
    log
  } = options

  if (is.empty(blocks)) {
    return []
  }

  let parsed_blocks = []

  let autofill_list = annotations.autofill_list(file.type)

  // loop over each block
  for (let i in blocks) {
    let block = blocks[i]

    block.comment.contents = to.normalize(block.comment.contents)
    block.code.contents = to.normalize(block.code.contents)

    let parsed = parse_block({
      annotations,
      block,
      comment,
      file,
      log
    })

    parsed = autofill({ autofill_list, parsed, block, log })

    if (!is.empty(parsed)) {
      parsed_blocks.push({
        ...parsed,
        __start: block.comment.start,
        __end: block.comment.end
      })
    }
  } // end blocks loop

  return parsed_blocks
}


// @name parse_block
// @description
// This parses the content passed to it seperates out each annotation
// parses and figures out the annotation line, and the content after it.
// Then once it has all the information it calls the annotation function(the annotation one it found)
// for this file type or the default function.
// @arg {object} - The blocks to parse
function parse_block(options = {}) {
  let {
    annotations,
    block,
    comment,
    file,
    log
  } = options

  // gets the annotations to use on this file
  let annotations_list = annotations.list(file.type);
  let keys = to.keys(annotations_list)

  let contents = to.array(block.comment.contents)
  let block_annotations = {}
  let annotation = {} // holds the current annotation

  // loop over each line in the comment block
  for (let i = 0, l = contents.length; i < l; i++) {
    let line = contents[i]
    let prefix_index = line.indexOf(comment.prefix)

    // a) there is an index of the annotation prefix
    if (prefix_index >= 0) {
      let first_space = line.indexOf(' ', prefix_index)
      let name = line.slice(prefix_index + 1, first_space >= 0 ? first_space : line.length)

      // a) the name is one of the annotation names
      if (keys.indexOf(name) >= 0) {
        // a) parse the current annotation
        if (!is.empty(annotation)) {
          annotation.end = i - 1

          // run the annotation function and merge it with the other annotations in the block
          to.merge(block_annotations, {
            [annotation.name]: annotations.run({
              annotation,
              annotations_list,
              block,
              file,
              log
            })
          })
        }

        // redefines resets the current annotation to be blank
        annotation = {
          name, // sets the current annotation name
          line: line.slice(prefix_index + 1 + name.length), // removes the current annotation name and it's prefix from the first line
          contents: [],
          start: i, // sets the starting line of the annotation
          end: 0
        }
      }
    }

    // a) adds the current line to the contents
    if (!is.empty(annotation)) {
      annotation.contents.push(line)
    }

    // a) is the last line in the comment block
    if (i === l - 1 && !is.empty(annotation)) {
      annotation.end = i

      // run the annotation function and merge it with the other annotations in the block
      to.merge(block_annotations, {
        [annotation.name]: annotations.run({
          annotation,
          annotations_list,
          block,
          file,
          log
        })
      })
    }
  } // end block loop

  return block_annotations
}