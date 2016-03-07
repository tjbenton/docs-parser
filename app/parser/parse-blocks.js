import { is, to } from '../utils'
import autofill from './autofill'
import resolve from './resolve'

// @name parsed_blocks
// @access private
// @description
// Used to parse an array of blocks and runs the annotations function and returns the result
// @arg {array} - The block/blocks you want to have parsed
// @returns {array} of parsed blocks
export default function parseBlocks({
  file,
  blocks,
  annotations,
  sort,
  log
}) {
  if (is.empty(blocks)) {
    return []
  }

  let parsed_blocks = []

  let annotation_types = annotations.lists(file.type)

  // sort the parsed object before the annotations are resolved
  if (is.fn(sort)) {
    annotation_types.resolve = to.sort(annotation_types.resolve, sort)
  }

  // loop over each block
  for (let block of blocks) {
    block.comment.contents = to.normalize(block.comment.contents)
    block.code.contents = to.normalize(block.code.contents)

    let parsed = parseBlock({
      annotations,
      annotation_types,
      block,
      file,
      log
    })

    // run the autofill functions for all the annotations that have a autofill function
    parsed = autofill({ list: annotation_types.autofill, parsed, block, log })

    if (!is.empty(parsed)) {
      // run the resolve function for all the annotations that have a resolve function
      parsed = resolve({ list: annotation_types.resolve, parsed, block, log })
      parsed_blocks.push(parsed)
    }
  } // end blocks loop

  return parsed_blocks
}


// @name parseBlock
// @description
// This parses the content passed to it seperates out each annotation
// parses and figures out the annotation line, and the content after it.
// Then once it has all the information it calls the annotation function(the annotation one it found)
// for this file type or the default function.
// @arg {object} - The blocks to parse
function parseBlock(options = {}) {
  let {
    annotations,
    annotation_types,
    block,
    file,
    log
  } = options

  let keys = to.keys(annotation_types.main)

  let contents = to.array(block.comment.contents)
  let block_annotations = {}
  let annotation = {} // holds the current annotation

  // loop over each line in the comment block
  for (let i = 0, l = contents.length; i < l; i++) {
    let line = contents[i]
    let prefix_index = -1

    if (
      !is.any.in(
        line,
        `${file.options.header.line} ${file.options.prefix}`,
        `${file.options.body.line} ${file.options.prefix}`,
        `\\${file.options.prefix}`
      )
    ) {
      prefix_index = line.indexOf(file.options.prefix)
    }


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
              annotation_types,
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
          alias: is.in(annotation_types.alias, name) ? annotation_types.alias[name] : [],
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
          annotation_types,
          block,
          file,
          log
        })
      })
    }
  } // end block loop

  return block_annotations
}
