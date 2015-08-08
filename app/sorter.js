import {info, fs, path, is, to} from "./utils.js";

/// @name sort
/// @description
/// Sorts the parsed data into pages and creates the navigation
/// @arg {object}
/// @returns {object}
export default function(json){
 let nav = {}, // holds the navigation for the pages
     pages = {}, // holds the pages of documentation
     _settings = {
      header: {
       // This can be file "type", "", false if you always
       // want to go with what's declared in the page.
       prepend_type: true
      },
      body: {
       // same as `header.page_prepend` but this is for body comment blocks
       prepend_type: false
      }
      // todo: true, // create a todo page with ALL the todo comments listed
     },
     // @name set
     // @description
     // creates a structure from an array, and adds the passed object to
     // the `base` array if it was passed.
     //
     // @returns {object} - The nested object with the set value
     set = (path, type, value) => {
      // ensures values won't change in the passed value
      value = to.clone(value);

      // deletes the page from the value so it
      // won't get added to the data
      delete value.page;

      let _pages = pages,
          _nav = nav,
          path_list = path.split("/").filter(Boolean), // convert to array, and filter out empty strings
          length = path_list.length - 1;

      for(var i = 0; i < length; i++){
       var elem = path_list[i];
       if(!_pages[elem]){
        _pages[elem] = {
         page: {
          header: {},
          body: []
         }
        };
       }
       _pages = _pages[elem];
      }

      // a) Define the default data set(can't use `page` because it will be overwritten)
      if(!_pages[path_list[length]]){
       _pages[path_list[length]] = {
        page: {
         header: {},
         body: []
        }
       };
      }

      if(type === "header"){
       _pages[path_list[length]].page.header = to.merge(_pages[path_list[length]].page.header, value);
      }else{
       _pages[path_list[length]].page.body.push(value);
      }
     };


 // loop over each filetype in the json object
 for(let [filetype, files] of to.entries(json)){
  // loop over each file in the filetype object
  for(let file of files){
   // a) Ensures there's only one page defined in the header
   // b) There wasn't a page defined so set it to general
   file.header.page = file.header.page ? file.header.page[0] : "general";

   // a) Prepend the filetype to the page
   if(is.truthy(_settings.header.prepend_type)){
    file.header.page = path.join(file.info.type, file.header.page);
   }

   // a) Set the name in the header to be the name of the file
   if(is.falsy(file.header.name)){
    file.header.name = to.case.title(file.info.name);
   }

   // set the header for the file
   set(file.header.page, "header", file.header);

   // console.log(file.header.page);
   // loop over each block in the body of the file
   for(let block of file.body){
    // a) loop over each page in the block,
    //    and add the block to that page.
    if(block.page){
     for(let page of block.page){
      if(page !== file.header.page){
       set(page, "body", block);
      }
     }
    }

    // add the block to the page
    set(file.header.page, "body", block);
   }
  }
 }

 return {
  nav,
  pages
 };
};