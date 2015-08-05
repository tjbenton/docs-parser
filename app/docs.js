"use strict";
import {info, fs, path, is, to} from "./utils.js";
import paths from "./paths.js";
import AnnotationApi from "./annotation";
import parser from "./parser.js";

////
/// @name docs.js
/// @author Tyler Benton
/// @description
/// This is used to parse any filetype that you want to and gets the documentation for it and returns an {} of the document data
////
var docs = (function(){
 // the main object to return
 let _ = {
      is,
      to,
      annotation: new AnnotationApi()
     };

 // the settings object that holds the file specific settings as well as the base settings
 _.file_specific_settings = {
  css: {
   header: {
    start: "/***",
    line: "*",
    end: "***/"
   },
   body: {
    start: "/**",
    line: "*",
    end: "**/"
   }
  },
  rb: {
   header: {
    start: "###",
    line: "##",
    end: "###"
   },
   body: {
    line: "##"
   }
  },
  html: {
   header: {
    start: "<!----",
    end: "/--->"
   },
   body: {
    start: "<!---",
    end: "/-->"
   }
  },
  cfm: {
   header: {
    start: "<!-----",
    end: "/--->"
   },
   body: {
    start: "<!----",
    end: "/--->"
   }
  }
 };
 _.file_specific_settings.py = _.file_specific_settings.rb;
 // _.file_specific_settings.coffee = _.file_specific_settings.rb;

 /// @name settings
 /// @description Merges the default settings with the file specific settings
 /// @arg {string} filetype - the current filetype that is being parsed
 /// @returns {object} the settings to use
 _.settings = filetype => {
  let defaults = {
   header: { // file level comment block identifier
    start: "////",
    line: "///",
    end: "////"
   },
   body: { // block level comment block identifier
    start: "",
    line: "///",
    end: ""
   },
   blank_lines: 4, // @todo this stops the current block from adding lines if there're `n` blank line lines between code, and starts a new block.
   annotation_prefix: "@", // annotation identifier(this should probably never be changed)
   single_line_prefix: "#" // single line prefix for comments inside of the code below the comment block
  };
  return !is.undefined(_.file_specific_settings[filetype]) ? to.extend(defaults, _.file_specific_settings[filetype]) : defaults;
 };

 /// @name setting
 /// @description Allows you to specify settings for specific file types
 /// @arg {string} extention - the file extention you want to target
 /// @arg {object} obj - the settings you want to adjust for this file type
 _.setting = (extention, obj) => {
  return to.extend(_.file_specific_settings, {
   [extention]: obj
  });
 };

 /// @name parse
 /// @description Takes the contents of a file and parses it
 /// @arg {string, array} files - file paths to parse
 /// @arg {boolean} changed [true] - If true it will only parse changed files
 /// @promise
 /// @returns {object} - the data that was parsed
 _.parse = (files, changed) => {
  console.time("total-runtime"); // starts the timer for the total runtime

  return new Promise((resolve, reject) => {
   paths(files, changed)
    .then((file_paths) => {
     console.log("FILE_PATHS:", file_paths.length);
     console.time("parsing-runtime");

     // Converts the `file_paths` into an array of parsing files.
     // Onces they're all parsed then return the array of parsed files.
     return Promise.all(file_paths.map((file_path) => parser(file_path, _.settings, _.annotation)));
    })
    .then((parsed_files) => {
     console.timeEnd("parsing-runtime");
     // get the stored data file if it exists, or return an empty object
     return new Promise((resolve, reject) => {
      fs.readJson(info.temp.file)
       .then((json) => json)
       .catch((err) => {
        return {};
       })
       .then((json) => {
        // Loop through the parsed files and update the
        // json data that was stored.
        for(let data in parsed_files){
         to.extend(json, parsed_files[data]);
        }

        resolve(json);

        // Update the temp json data. Even though this returns a promise
        // it's not returned below because there's no need to wait for it
        // to finish writing out the json file before moving on. Because the
        // `json` object has already been updated.
        fs.outputJson(info.temp.file, json, {
         spaces: 2
        }, 1);
       });
     });
    })
    .then((json) => {
     console.timeEnd("total-runtime"); // ends the timer for the total runtime
     resolve({
      /// @name parse().data
      /// @description Placeholder for the data so if it's manipulated the updated data will be in the other functions
      data: json,

      /// @name parse().write
      /// @description Helper function to write out the data to a json file
      /// @arg {string} location - The location to write the file too
      /// @arg {number,\t,\s} spacing [1] - The spacing you want the file to have.
      /// @returns {this}
      write(location, spacing){
       fs.writeJson(temp_file, this.data, (err) => err && console.error(err));
       return this;
      },

      // @todo {tylerb} - Add a way to documentize the files
      // This should be apart of it's own code base so it doesn't pollute this one.
      // @returns {this}
      documentize(){
       console.log("documentize");
      }
     });
    })
    .catch((err) => {
     reject({});
     throw new Error(err);
    });
  });
 };

 return _;
})();


export default docs;
