import {info, fs, path, is, to} from "./utils.js";

/// @name sort
/// @description
/// Sorts the parsed data into pages and creates the navigation
/// @arg {object}
/// @returns {object}
export default function(json){
 to.log("SORT /////////////////////////////////////////////////////////////////////////");
 let result = {},
     _settings = {
      // todo: true, // create a todo page with ALL the todo comments listed
     };

 // loop over each filetype in the json object
 for(let [filetype, files] of to.entries(json)){
  if(filetype === "less"){
   // loop over each file in the filetype object
   for(let file of files){

    // a) set the page to be the filepath
    if(is.undefined(file.header.page)){

    }

    // loop over each block in the body of the file
    for(let block of file.body){
     
    }
   }
  }
 }
 // to.log("");
 return json;
};