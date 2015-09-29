"use strict";
import {Deferred, fs, path, info, glob, is, to} from "./utils.js";

// @name paths
// @description
// Filters out changed files, `.md` files, and paths that aren't files
// @promise
// @args {array, string}
// @returns {array} - Filtered file paths
export default function paths(globs, changed = true) {
  globs = to.array(globs); // Converts globs into an array if it's not already.

  // @name get_paths
  // @description
  // This gets the file paths to check
  // @arg {array} - of file path globs
  // @promise
  // @returns {array} - the filepaths to return
  function get_paths(files) {
    return new Promise((resolve, reject) => {
      let globs = [];
      // get the files paths using glob
      for (let i = 0, l = files.length; i < l; i++) {
        globs.push(glob(files[i]));
      }

      Promise.all(globs)
       .then((result) => resolve(to.array.flat(result)))
       .catch((err) => {
         throw err;
       });
    });
  };

  // @name check
  // @description
  // checks the status of the file to see if it has changed or not.
  // @arg {string} - path to file
  // @promise
  // @returns {string} - this will be the filepath or an empty string
  function check(file) {
    var source = path.join(info.root, file),
        target = path.join(info.temp.folder, file);
    return new Promise((resolve, reject) => {
      Promise.all([fs.stat(source), fs.stat(target)])
        .then(function(stats) {
          // a) copies source file into the target directory because it's newer
          if (stats[0].mtime > stats[1].mtime) {
            resolve(source);
            fs.fake_copy(source, target); // copies new files over.
          } else {
            resolve(Promise.resolve(""));
          }
        })
        .catch((err) => {
          fs.fake_copy(source, target); // copies new files over.
          resolve(source);
        });
    });
  };

  // @name filter
  // @description
  // Filters out
  //  - changed files if `changed` is true,
  //  - `.md`, and `.` files(always)
  //  - any paths that aren't files
  //
  // @arg {array} of globs
  // @promise
  // @returns {array} - Array of file paths
  function filter(files) {
    files = files.filter((obj) => {
      let ext = path.extname(obj).toLowerCase();
      return ext !== ".md" && ext.charAt(0) === ".";
    });

    // a) Return all the files that were passed except
    //    the `.md`, and `.` files.
    if (!changed) {
      return Promise.resolve(files);
    }

    return new Promise((resolve, reject) => {
      Promise.all(files.map((file) => check(file)))
       .then((to_filter) => resolve(to.array.unique(to.array(to_filter))))
       .catch((err) => {
         resolve([]);
         throw err;
       });
    });
  };

  return new Promise((resolve, reject) => {
    get_paths(globs)
      .then((files) => filter(files))
      .then((filtered_files) => resolve(filtered_files))
      .catch((err) => {
        throw err;
      });
  });
};
