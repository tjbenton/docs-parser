import { to } from '../utils'
import { logAnnotationError } from './annotation-utils'
/// @name blockinfo
/// @description
/// This annotation is a special one in that it's only autofilled, and it adds
/// information about the current block
///
/// Here's an example of the information that it returns
///
/// ```
/// "blockinfo": {
///   "comment": {
///     "start": 1,
///     "end": 3,
///     "type": "header"
///   },
///   "code": {
///     "start": -1,
///     "end": -1
///   },
///   "file": {
///     "path": "docs/tests/annotations/access/access.header.js",
///     "start": 1,
///     "end": 4
///   }
/// }
/// ```
export default {
  autofill() {
    let obj = to.clone(this)
    let comment = obj.comment
    let code = obj.code
    let file = obj.file
    delete comment.contents
    delete code.contents
    delete file.contents
    delete file.name
    delete file.type
    delete file.comment

    return { comment, code, file }
  },
  parse() {
    this.log.emit('warning', "Passed @blockinfo, it's only supposed to be an autofilled annotation", logAnnotationError(this, ''))
    return
  }
}
