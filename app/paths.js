"use strict";
import fs from "fs";
import path from "path";
import glob from "glob";
import Deferred from "./deferred.js";


fs.mkdirp = (dir, mode, callback) => {
 var _mode = parseInt("0777", 8); // Because `Octal literals are not allowed in strict mode.`
 if(callback === void 0){
  callback = mode;
  mode = _mode;
 }
 if(mode === void 0){
  mode = _mode;
 }

 //Call the standard fs.mkdir
 fs.mkdir(dir, mode, error => {
  //When it fail in this way, do the custom steps
  if(error && error.code !== "EEXIST"){
   //Create all the parents recursively
   fs.mkdirp(path.dirname(dir), mode, callback);

   //And then the directory
   fs.mkdirp(dir, mode, callback);
  }

  //Manually run the callback since we used our own callback to do all these
  callback && callback(error);
 });
};

fs.copy = (source, target, callback) => {
 let cbCalled = false;

 source = path.parse(source);
 target = path.parse(target);

 // creates the directory path if it doesn't exist
 fs.mkdirp(path.resolve(source.dir, path.relative(source.dir, target.dir)), () => {
  let source_stream = fs.createReadStream(path.join(source.dir, source.base)), // creates a read stream
      target_stream = fs.createWriteStream(path.join(target.dir, target.base)); // creates a write stream
  // handles errors for the read stream
  source_stream.on("error", err => done(err));

  // handles errors for the write stream
  target_stream.on("error", err => done(err));

  // handles the callback for when the file has been successfully copied
  target_stream.on("close", ex => done());
  source_stream.pipe(target_stream);
 });

 // used as a helper function for the error handling
 function done(err){
  if(!cbCalled){
   callback && callback(err);
   cbCalled = true;
  }
 };
};

fs.fake_copy = (source, target, callback) => {
 var cbCalled = false,
     source = path.parse(source),
     target = path.parse(target);

 // creates the directory path if it doesn't exist
 fs.mkdirp(path.resolve(source.dir, path.relative(source.dir, target.dir)), () => {
  fs.writeFile(path.join(target.dir, target.base), "", () => callback && callback());
 });
};

export default function paths(globs, changed){
 // a) sets changed to be true by default
 if(changed === undefined){
  changed = true;
 }

 var base = process.cwd() + "/",
     write_folder = ".tmp/",

     // @name Files
     // @description
     // Converts `files` into a deferred so ti can get the
     paths = files => {
      var deferred = new Deferred(),
          result = [];

      // converts the string to an array so it can be looped over
      if(Object.prototype.toString.call(files) === "[object String]"){
       files = [files];
      }

      // get the files paths using glob
      for(var i = 0, l = files.length; i < l; i++){
       result.push.apply(result, glob.sync(files[i]));
       if(i === 0){
        deferred.resolve(result);
       }
      }
      return deferred.promise();
     },

     // @name check
     // @description
     // checks the status of the file to see if it has changed or not.
     // @returns {boolean}
     check = file => {
      var deferred = new Deferred(),
          source = base + file,
          target = base + write_folder + file;

      // gets the status of the source file
      fs.stat(source, (err, source_stats) => {
       // a) returns an error
       if(err){
        return deferred.reject(err);
       }

       // gets the status of the target file
       fs.stat(target, (err, target_stats) => {
        // a) copies source file into the target directory and returns the source
        if(target_stats === void 0 || (target_stats.mtime < source_stats.mtime)){
         // copies new files over.
         fs.copy(source, target);
         return deferred.resolve(source);
        }

        return deferred.resolve(false);
       });
      });

      return deferred.promise();
     },

     // @name filter
     // @description
     // Checks the file and if it was changed then that file
     // gets returned in the array
     //
     // @returns {array} - Array of changed files
     filter = files => {
      var deferred = new Deferred(),
          changed_paths = [];

      // loops over all the files and filters out the files that haven't changed
      for(var i = 0, l = files.length; i < l; i++){
       var file = files[i];
       changed_paths.push(check(file));

       // a) filters out the changed files
       if(i === l - 1){
        Deferred.when.all(changed_paths)
         .done(result => deferred.resolve(result.filter(obj => obj)));
       }
      }

      return deferred.promise();
     },
     result = new Deferred();

 Deferred.when(paths(globs))
  .done(files => !changed ? result.resolve(files) : Deferred.when(filter(files)).done(filtered_files => result.resolve(filtered_files)));

 return result.promise();
};