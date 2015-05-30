"use strict";
var fs = require("fs"),
    path = require("path"),
    glob = require("glob"),
    Deferred = require("./deferred.js");

fs.mkdirp = function(dir, mode, callback){
 var _mode = parseInt("0777", 8); // Because `Octal literals are not allowed in strict mode.`
 if(callback === void 0){
  callback = mode;
  mode = _mode;
 }
 if(mode === void 0){
  mode = _mode;
 }

 //Call the standard fs.mkdir
 fs.mkdir(dir, mode, function(error){
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

fs.copy = function(source, target, callback){
 var cbCalled = false,
     source = path.parse(source),
     target = path.parse(target);

 // creates the directory path if it doesn't exist
 fs.mkdirp(path.resolve(source.dir, path.relative(source.dir, target.dir)), function(){
  var source_stream = fs.createReadStream(path.join(source.dir, source.base)), // creates a read stream
      target_stream = fs.createWriteStream(path.join(target.dir, target.base)); // creates a write stream
  // handles errors for the read stream
  source_stream.on("error", function(err){
   done(err);
  });

  // handles errors for the write stream
  target_stream.on("error", function(err){
   done(err);
  });

  // handles the callback for when the file has been successfully copied
  target_stream.on("close", function(ex){
   done();
  });
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

fs.fakeCopy = function(source, target, callback){
 var cbCalled = false,
     source = path.parse(source),
     target = path.parse(target);

 // creates the directory path if it doesn't exist
 fs.mkdirp(path.resolve(source.dir, path.relative(source.dir, target.dir)), function(){
  fs.writeFile(path.join(target.dir, target.base), "", function(){
   callback && callback();
  });
 });
};

function changed(globs, settings, callback){
 var base = process.cwd() + "/",
     settings = {
      write_folder: ".tmp/"
     },

     // @name Files
     // @description
     // Converts `files` into a deferred so ti can get the
     paths = function(files){
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
     check = function(file){
      var deferred = new Deferred(),
          source = base + file,
          target = base + settings.write_folder + file;

      // gets the status of the source file
      fs.stat(source, function(err, source_stats){
       // a) returns an error
       if(err){
        return deferred.reject(err);
       }

       // gets the status of the target file
       fs.stat(target, function(err, target_stats){
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
     filter = function(files){
      var deferred = new Deferred(),
          changed = [];

      // loops over all the files and filters out the files that haven't changed
      for(var i = 0, l = files.length; i < l; i++){
       var file = files[i];
       changed.push(check(file));
       if(i === l - 1){
        Deferred.when.all(changed)
         .done(function(result){
          deferred.resolve(result.filter(function(obj){
           return obj;
          }));
         });
       }
      }

      return deferred.promise();
     },
     result = new Deferred();

 Deferred.when(paths(globs))
  .done(function(files){
   return Deferred.when(filter(files))
           .done(function(filtered_files){
            console.log("filtered files =", filtered_files);
            result.resolve(filtered_files);
           });
  });

 return result.promise();
};


// Module exports
// a) export module
// b) define amd
// c) add changed to the root
if(typeof exports !== "undefined"){
 if(typeof module !== "undefined" && module.exports){
  exports = module.exports = changed;
 }
 exports.changed = changed;
}else if(typeof define === "function" && define.amd){ // AMD definition
 define(function(require){
  return changed;
 });
}else{
 root[ "changed" ] = changed;
}