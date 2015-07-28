/// @name name
/// @page annotations
/// @description Name of the documented item
/// @returns {string}
export default {
 name: "name",
 alias: [],
 callbacks: { // stores all the functions for the different filetypes
  default: { // stores the default function
   // this is the function that runs when the parser gets
   // the annotations information
   callback: function(){
    return this.annotation.line;
   },

   // this runs when the each annotation
   // in the block has been parsed. If the annotation
   // doesn't exist and the autofill is set to be a function
   // then autofill get's called, and the block and file info
   // are accessible within `this`
   autofill: false,

   // this runs after the callback and/or autofill runs
   // the contents of `this` is what was returned by the
   // callback and/or autofill.
   // It's used to fixed data that was returned by callback.
   // It helps when members on your team pass in the wrong keyword(s)
   // and let's you resolve them here instead of resolving the issues on
   // the client side
   resolve: false
  },

  // stores other file specific functions, these are merged
  // with the default to ensure all properties are defined
  js: {

  }
 }
};