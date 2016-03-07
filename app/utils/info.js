import path from 'path'

// Stores the project directory to use later
let info = {}
info.root = process.cwd() // gets the root directory

info.dir = info.root.split(path.sep) // splits the project dir by the system specific delimiter
info.dir = info.dir[info.dir.length - 1] // gets the working directory

export default info
