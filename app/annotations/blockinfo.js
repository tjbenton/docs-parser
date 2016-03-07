import { to, is } from '../utils'
import { logAnnotationError } from './annotation-utils'
/// @name blockinfo
/// @page annotations
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
    delete comment.contents

    let code = obj.code
    delete code.contents

    const file_filter = [ 'contents', 'name', 'type', 'comment', 'options' ]
    let file = to.filter(obj.file, ({ key }) => !is.in(file_filter, key))

    return { comment, code, file }

    // @todo {5} decide if `comment` needs the `type` key. If it doesn't need
    // it then just use the code below because it removes all the things that
    // aren't needed from each of the values in `this`
    // const filter = [ 'contents', 'name', 'type', 'comment', 'options' ]
    // return to.map(this, (obj) => {
    //   return {
    //     [obj.key]: to.filter(obj.value, ({ key }) => !is.in(filter, key))
    //   }
    // })
  },
  parse() {
    this.log.emit('warning', "Passed @blockinfo, it's only supposed to be an autofilled annotation", logAnnotationError(this, ''))
    return
  }
}
