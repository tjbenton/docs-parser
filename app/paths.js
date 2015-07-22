"use strict";
import {Deferred, fs, path, glob, to_string, is} from "./utils.js";

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
       if(i === l - 1){
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
         fs.copy(source, target, (err) => err && console.log(err));
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
         .done(result => deferred.resolve(result.filter(obj => obj && obj.indexOf(".") > -1)));
       }
      }

      return deferred.promise();
     },
     result = new Deferred();

 Deferred.when(paths(globs))
  .done(files => !changed ? result.resolve(files) : Deferred.when(filter(files)).done(filtered_files => result.resolve(filtered_files)));

 return result.promise();
};