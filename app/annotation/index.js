"use strict";

import annotations from "./annotations";
import {is, to} from "../utils.js";

export default class AnnotationApi{
 constructor(){
  // stores the current annotation that is being added
  // to the annotations list.
  // the name of the annotation is always the key
  this.annotation_base = {
   alias: [], // holds an array of aliases for the given annotation
   // stores all the callback functions for the different filetypes
   callbacks: {
    default: { // stores the default function
     // This function runs when the parser gets
     // the annotations information
     callback: function(){
      return this.annotation.line;
     },

     // Runs when the each annotation in the block has been
     // parsed. If the annotation doesn't exist and the autofill
     // is set to be a function then autofill get's called, and
     // the block and file info are accessible within `this` if
     // it is a function.`. **Note** this will not run if the
     // annotation exists
     autofill: false,

     // Runs after the callback and/or autofill runs the contents
     // of `this` is what was returned by the callback and/or autofill.
     // It's used to fixed data that was returned by callback.
     // It helps when members on your team pass in the wrong keyword(s)
     // and let's you resolve them here in the data instead of resolving
     // the issues on the client side
     resolve: false
    }
    // You can add file specific overrides if you need to. All you have
    // to do is specific the filetype as the key(aka replace default with the filetype)
    // js: {
    //  callback: ...,
    //  autofill: ...,
    //  resolve: ...,
    // }
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
 // @arg {string, array} annotation - Name of the annotation
 // @arg {function, object} callbacks [annotation_base.callbacks] - Functions
 // @arg {string} ...alias - the rest of the arguments are alias
 //
 // @returns {this}
 //
 // @markup **Example:**
 // annotation_api
 //  .add()
 add(annotation, callbacks = this.annotation_base.callbacks, ...alias){
  // a) run the each annotation through the annotations
  // b) log an error
  if(is.array(annotation)){
   this.add_annotations(annotation);
   return; // stops this function from running;
  }
  else if(is.object(annotation)){
   alias = to.array(annotation.alias || []);
   callbacks = annotation.callbacks || callbacks;
   annotation = annotation.name || "";
  }

  if(!is.string(annotation) || is.string(annotation) && is.empty(annotation)){
   throw new Error("annotation must be a string or array of annotations");
   return;
  }

  // a) Add the callbacks to the alias and set callbacks to be an empty object
  // b) Set the passed function as the default for this annotation namespace
  // c) Throw an error because
  if(is.string(callbacks) || is.array(callbacks)){
   alias = to.array.flat([alias, callbacks]);
   callbacks = {};
  }
  else if(is.function(callbacks) || is.object(callbacks) && is.in(callbacks, "callback", "autofill", "resolve")){
   callbacks = {
    default: {
     callback: callbacks
    }
   };
  }
  else if(!is.object(callbacks)){
   throw new Error("callbacks must me a function, object. If a string is passed it's treated as an alias");
  }

  // a) loop over each of the callbacks and extend them
  //    with the base settings for a callback
  if(!is.empty(callbacks)){
   for(let item in callbacks){
    callbacks[item] = to.extend(to.clone(base.callbacks.default), callbacks[item]);
   }
  }

  // merge the passed annotation with the
  // global list of annoations
  to.merge(this.list, {
   [annotation]: {
    alias,
    callbacks: callbacks
   }
  });

  return this;
 };

 // @name annotations_list
 // @description
 // Gets the list of annotations
 get annotations_list(){
  return this.list;
 }

 // @name filetype
 // @description
 // This is used to set the current filetype
 // @arg {string}
 set filetype(filetype){
  this.filetype = filetype;
 };

 // @description
 // Add an array of annotations
 // @arg {array} annotations - Annotation objects
 add_annotations(annotations){
  for(let i in annotations){
   this.add(annotations[i]);
  }
 };
}
