/* eslint-disable complexity, max-statements, max-depth */
import { is, to } from '../utils'

/// @name blocks
/// @access private
/// @description Parses the file and returns the comment blocks in an array
/// @returns {array} of the comment blocks
/// @todo {5} - add a line offest argument to this so that you can call parse content on other language types.
export default function getBlocks({
  file,
  comment,
  restrict = true,
  blank_lines,
  start_at = 0
}) {
  start_at = to.number(start_at)

  let style = is.all.truthy(comment.start, comment.end) ? 'multi' : 'single'

  // this ensures there aren't any errors looking comment lines
  // because `''` will always have an index of `0`
  if (comment.line === '') {
    comment.line = undefined
  }

  let block_base = {
    comment: { contents: [], start: -1, end: -1, type: comment.type },
    code: { contents: [], start: -1, end: -1 },
    file
  }

  let lines = to.array(file.contents) // lines of the file
  let parsed = [] // holds the parsed blocks
  let current_blank_lines = 0 // stores the current count of blank lines
  let block // stores the current block
  let in_comment = false // used to determin that you are in a comment
  let in_code = false // used to determin if you are in the code after the comment block

  if (style === 'multi' ? !is.all.in(file.contents, comment.start, comment.end) : !is.in(file.contents, comment.line)) {
    return []
  }

  // used for debuging files. to debug a file just change this to false
  // @note THIS SHOULD NEVER BE COMMITTED AS `TRUE`
  let debug_file = false
  function debug(...args) {
    if (debug_file && args.length > 0) {
      console.log(...args)
    }
    return debug_file
  }


  function pushBlock(block_to_push) {
    block_to_push.comment.contents = to.normalize(block_to_push.comment.contents)
    block_to_push.code.contents = to.normalize(block_to_push.code.contents)
    parsed.push(block_to_push)
  }

  for (let i = start_at, l = lines.length; i < l; i++) {
    // If you're trying to debug something between specific lines you
    // can use this to narrow down the longs to the lines you're wanting debug
    // just pass in the starting line number and end line number both should be 1
    // less that what you're looking for since this is zero based.
    // debug = is.between(i, [start line], [end line])
    debug_file = debug_file && is.between(i, 0, 8)
    let line = lines[i]
    let index = {
      start: style === 'multi' && is.in(line, comment.start) ? line.indexOf(comment.start) : false,
      line: is.in(line, comment.line) ? line.indexOf(comment.line) : false,
      end: style === 'multi' && is.in(line, comment.end) ? line.indexOf(comment.end) : false
    }

    debug('')
    debug('')
    debug(`line ${i}:`)
    debug(line)
    debug('index:', index)

    // a) The line isn't empty so parse it.
    if (!is.empty(line)) {
      // reset the current blank line count back to 0 because this line wasn't empty
      current_blank_lines = 0

      // a) is the start and end style or there was an instance of a comment line
      if (style === 'multi' && (index.start !== false || in_comment) || index.line !== false) {
        // a) is the start of a new block
        if (index.start !== false || (style !== 'multi' && !in_comment)) {
          debug('start of new block')
          // reset code to false
          in_code = false

          // a) There was block that has already been processed
          if (!is.undefined(block)) { // holds the current block information
            block.code.end = i - 1
            pushBlock(block)

            // Stops the loop after the first comment block
            // has been parsed. This is for file header comments
            if (restrict) {
              block.comment.end = i
              block.code.end = -1
              return parsed
            }
          }

          // reset the `block` to use on the new block
          block = to.clone(block_base)
          block.comment.start = i

          in_comment = true
        }

        // check for the end comment
        if (
          block &&
          style === 'multi' &&
          block.comment.start !== i &&
          index.end !== false
        ) {
          debug('is end comment')
          in_comment = false
          block.comment.end = i // sets the end line in the comment block
          i++ // skips end comment line
          line = lines[i] // updates to be the next line
          index.end = (line && is.in(line, comment.end)) ? line.indexOf(comment.end) : false
        }

        // a) adds this line to block comment contents
        if (in_comment && (index.start === false || index.end === false)) {
          // a) removes the `comment.line` from the line.
          if (index.line !== false) {
            line = line.slice(index.line + comment.line.length)
          } else if (index.start !== false) {
            line = line.slice(index.start + comment.start.length)
          }

          if (!is.empty(line)) {
            debug('line was pushed')
            block.comment.contents.push(line)
          }
        }

        // a) The last line in the file is a commment
        if (in_comment && (style === 'multi' && index.end !== false ? i === l : i === l - 1)) {
          debug('the last line in the file is a comment')
          block.comment.end = style === 'multi' ? i - 1 : i
          pushBlock(block)
          break // ensures that the loop stops because it's the last line in the file
        }

        // a) check the next line for an instance of the a line comment
        if (style !== 'multi' && !is.in(lines[i + 1], comment.line)) {
          in_comment = false
          block.comment.end = i // sets the end line in the comment block
          i++ // skips end comment line // @todo why does this need to be skipped?
          line = lines[i] // updates to be the next line
        }
      }

      // a) add code to current block
      if (!in_comment && index.end === false && !is.undefined(block)) {
        // Stops the loop after the first comment block
        // has been parsed. This is for file header comments
        if (restrict) {
          pushBlock(block)
          break
        }
        // a) The previous line was a comment
        if (!in_code) {
          in_code = true
          block.code.start = i
        }

        // adds this line to block code contents
        block.code.contents.push(line)

        // a) pushes the last block onto the body
        if (i === l - 1) {
          block.code.end = i
          pushBlock(block)
        }
      }
    } else if (
      !is.undefined(block) && (
        ++current_blank_lines === blank_lines || // there were 4 consecutive blank lines so the code is skipped
        i === l - 1 && is.truthy(block) // the last line in the file was an empty line.
      )
    ) {
      block[block.comment.end > -1 ? 'code' : 'comment'].end = i
      pushBlock(block)
      block = undefined
    }
  } // end loop

  return parsed
}
