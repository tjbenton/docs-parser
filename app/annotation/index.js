"use strict";

import annotations from "./annotations";
import {is, to} from "../utils.js";

export default class AnnotationApi{
 constructor(filetype){
  this.filetype = options.filetype;

  // stores the current annotation that is being added
  // to the annotations list. This is used by `file`, and
  // `alias`
  this.annotation = {
   name: "",
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
     resolve: function(){}
    },

    // stores other file specific functions, these are merged
    // with the default to ensure all properties are defined
    js: {

    }
   }
  };

  // the list of all the annotations
  this.list = {};

  // adds the default annotations to the list
  this.add_annotations(annotations);
 };

 // @name add
 // @description
 // Adds a single annotation to the list
 //
 // @arg {string, object, array} annotation -
 // Name of the annotation
 //
 // @arg {function, object} obj - Annotation object
 // @returns {this}
 //
 // @markup **Example:**
 // annotation_api
 //  .add()
 add(annotation, obj){
  if(is.object(annotation)){
   // if(is.empty(annotation.name) && is.empty(annotation.alias)){
   //  throw "When adding an via an object you have to declare a \`name\`";
   // }
   obj = annotation;
  }
  else if(is.array(annotation)){
   // removes the first item in the array and
   // sets it to be the default name, then
   // sets the rest of the array as an alias
   this.annotation.name = annotation.shift();
   this.annotation.alias = to.array.unique(annotation);
  }

  if(is.function(obj)){
   this.annotation.callback.default = obj;
  }

  // for(var item in obj){
  //  to.extend(_.all_annotations, {
  //   [item]: to.extend(_.all_annotations[item] || {}, {
  //    [name]: obj[item]
  //   })
  //  });
  // }
  return this;
 };

 // @description
 // Add an array of annotations
 // @arg {array} annotations - Annotation objects
 add_annotations(args){
  // for(let i = 0, l = annotations.length; i < l; i++){
  for(let annotation in args){
   console.log("annotation:", annotation);
  }
  // annotation
 };
}


var annotation = function(){
 return new AnnotationApi();
};
