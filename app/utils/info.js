import path from 'path'

// Stores the project directory to use later
let info = {}
info.root = process.cwd() // gets the root directory

info.dir = info.root.split(path.sep) // splits the project dir by the system specific delimiter
info.dir = info.dir[info.dir.length - 1] // gets the working directory

info.temp = {}
// @todo {8} - come back and change the `.tmp` directory to be inside of `/node_modules/docs/.temp`
info.temp.folder = path.join(info.root, '.tmp')
info.temp.file = path.join(info.temp.folder, 'data.json')

export default info