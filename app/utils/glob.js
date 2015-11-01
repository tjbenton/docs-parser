import to from './to'
import is from './is'
import array from './array'
import denodeify from './denodeify'
import co from 'co'
import path from 'path'

// can't use `import` from es6 because it
// returns an error saying "glob" is read only
let _glob = denodeify(require('glob'))


/// @description
/// This is a better version of glob. It is built as a generator
/// that has the ability to ignore files. As well as the ability to run
/// a callback filter on the matched files. The callback can be async as well.
///
/// @arg {string, array} files - Glob patterns to get
/// @arg {string, array} ignore [[]] - Glob patterns to ignore
/// @arg {function, boolean} filter - Filter to run on the files
/// @arg {boolean} files_only [true] - Only return file paths
const glob = co.wrap(function*(files, ignore = [], filter, files_only = true) {
  files = array(to.array(files)).map((file) => _glob(file));
  ignore = array(to.array(ignore)).map((file) => _glob(file.replace(/!/, '')))

  files = to.flatten(yield files)
  ignore = to.flatten(yield ignore)

  // removed any files that are supposed to be ignored
  if (ignore.length) {
    files = files.filter((file) => {
      for (let i in ignore) {
        if (file.indexOf(ignore[i]) > -1) {
          return false
          break
        }
      }
      return true
    })
  }

  if (files_only) {
    files = files.filter((file) => path.extname(file).indexOf('.') > -1)
  }

  if (is.fn(filter)) {
    if (is.promise(filter())) {
      return yield array(files).filter(filter)
    }

    return files.filter(filter)
  }

  return files
})

export default glob