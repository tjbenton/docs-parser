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
 // a small object to help with reading and writing the temp data.
 const temp_data = {
        get(){
         return new Promise((resolve, reject) => {
          fs.readJson(info.temp.file)
           .then((err, data) => {
            resolve(err || data);
           })
           .catch((err) => {
            resolve({});
           });
         });
        },
        write(data){
         fs.outputJson(info.temp.file, data, {
          spaces: 2
         }, 1);
        }
       },
       _ = {
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
  return new Promise((resolve, reject) => {
   Promise.all([paths(files, changed), temp_data.get()])
    .then(promises => {
     let [file_paths, json] = promises;
     console.log("FILE_PATHS:", file_paths);
     console.log("JSON:", json);
     // loops over all the files that return
     for(let i in file_paths){
      let file_path = file_paths[i],
          filetype = path.extname(file_path).replace(".", ""), // the filetype of the current file
          parsed_data = parser(file_path, _.settings(filetype), _.annotation);

      // temp data stuff ------------------------------------------------------------

      // a) if the current block is undefined in the json objected then create it
      if(is.undefined(json[filetype])){
       json[filetype] = {};
      }

      // a) creates array for the filepath
      if(is.undefined(json[filetype][file_path])){
       json[filetype][file_path] = [];
      }

      // merges the existing array with the new blocks arrays
      json[filetype][file_path].push.apply(json[filetype][file_path], parsed_data);
     }

     // updates the temp file
     temp_data.write(json);

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
    });
  });
 };

 return _;
})();


export default docs;
