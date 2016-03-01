/* eslint-disable complexity, max-statements, max-depth */
import { is, to } from '../utils'

/// @name blocks
/// @access private
/// @description Parses the file and returns the comment blocks in an array
/// @returns {array} of the comment blocks
/// @todo {5} - add a line offest argument to this so that you can call parse content on other language types.
export default function getBlocks({
  file,
  contents,
  comment,
  restrict = true,
  blank_lines,
  start_at = 0
}) {
  start_at = to.number(start_at)

  let style = is.all.truthy(comment.start, comment.end) ? 'multi' : 'single'

  let block_base = {
    comment: { contents: [], start: -1, end: -1, type: comment.type },
    code: { contents: [], start: -1, end: -1 },
    file
  }

  let lines = to.array(contents)
  let parsed = []
  let current_blank_lines = 0
  let block
  let in_comment = false // used to determin that you are in a comment
  let in_code = false // used to determin if you are in the code after the comment block

  if (style === 'multi' ? !is.all.in(file.contents, comment.start, comment.end) : !is.in(file.contents, comment.line)) {
    return []
  }

  for (let i = start_at, l = lines.length; i < l; i++) {
    let line = lines[i]
    let index = {
      start: style === 'multi' && is.in(line, comment.start) ? line.indexOf(comment.start) : false,
      line: is.in(line, comment.line) ? line.indexOf(comment.line) : false,
      end: style === 'multi' && is.in(line, comment.end) ? line.indexOf(comment.end) : false
    }

    // a) The line isn't empty so parse it.
    if (!is.empty(line)) {
      current_blank_lines = 0
      // a) is the start and end style or there was an instance of a comment line
      if (style === 'multi' && (index.start !== false || in_comment) || index.line !== false) {
        // a) is the start of a new block
        if (index.start !== false || style !== 'multi' && !in_comment) {
          // reset code to false
          in_code = false

          // a) There was block that has already been processed
          if (!is.undefined(block)) { // holds the current block information
            block.code.end = i - 1 // @todo check to make sure this is correct
            parsed.push(block)

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

        // a) check for the end comment
        if (style === 'multi' && block.comment.start !== i && index.end !== false) {
          in_comment = false
          block.comment.contents.push(line)
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
          }

          block.comment.contents.push(line)
        }

        // a) The last line in the file is a commment
        if (in_comment && (style === 'multi' && index.end !== false ? i === l : i === l - 1)) {
          block.comment.end = style === 'multi' ? i - 1 : i
          parsed.push(block)
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
          parsed.push(block)
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
          parsed.push(block)
        }
      }
    } else if (
      !is.undefined(block) && (
        ++current_blank_lines === blank_lines || // there were 4 consecutive blank lines so the code is skipped
        i === l - 1 && is.truthy(block) // the last line in the file was an empty line.
      )
    ) {
      block[block.comment.end > -1 ? 'code' : 'comment'].end = i
      parsed.push(block)
      block = undefined
    }
  } // end loop

  return parsed
}
