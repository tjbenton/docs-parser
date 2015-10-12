// @name denodeify
// @description
// Takes functions that takes callbacks
// and converts it into a promise.
// @returns {promise}
// @markup {js}
// import fs from "fs"
// fs.readFile = denodeify(fs.readFile)
export default function denodeify(func) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      func(...args, (err, ...args) => err ? reject(err) : resolve(...args))
    })
  }
}