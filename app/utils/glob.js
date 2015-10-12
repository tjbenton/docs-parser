// can't use `import` from es6 because it
// returns an error saying "glob" is read only
import to from './to.js'
import denodeify from './denodeify'
import co from 'co'

let _glob = denodeify(require('glob'))

export default co.wrap(function*(globs, ignored_globs = []) {
  globs = to.array(globs)
  ignored_globs = to.array(ignored_globs)

  let matched_globs = []

  // get the files paths using glob
  for (let [i, file] of to.entries(globs)) {
    if (file.substr(0, 1) !== '!') {
      matched_globs.push(_glob(file).then((data) => data))
    } else {
      ignored_globs.push(file)
    }
  }

  let matched_ignored_globs = []
  // get the ignored_globs file paths
  for (let [i, file] of to.entries(ignored_globs)) {
    matched_ignored_globs.push(_glob(file.replace(/!/, '')))
  }

  matched_globs = yield Promise.all(matched_globs).then((result) => to.flat_array(result))
  matched_ignored_globs = yield Promise.all(matched_ignored_globs).then((result) => to.flat_array(result))

  // prevents extra functions from running if they don't need to
  if (!matched_ignored_globs.length) {
    return matched_globs
  }

  // return filtered files
  return matched_globs.filter((file) => {
    for (let i in matched_ignored_globs) {
      if (file.indexOf(matched_ignored_globs[i]) > -1) {
        return false
        break
      }
    }
    return true
  })
})