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

  // the list of all the annotations names
  this.annotation_names = [];

  // object of the all the annotation
  this.annotations = {};

  // stores all annotations that have an alias
  // this way it doesn't have to happen in the parser
  this.has_alias = {};

  // stores all the annoation aliases
  this.annotation_aliases = [];

  // adds the default annotations to the list
  this.add_annotations(annotations);
 };

 /// @name add
 /// @description
 /// Adds a single annotation to the list
 ///
 /// @arg {string, array} annotation - Name of the annotation
 /// @arg {function, object} callbacks [annotation_base.callbacks] - Functions
 /// @arg {string} ...alias - the rest of the arguments are alias
 ///
 /// @returns {this}
 ///
 /// @markup **Example:**
 /// annotation_api
 ///  .add()
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
    callbacks[item] = to.extend(to.clone(this.annotation_base.callbacks.default), callbacks[item]);
   }
  }

  // add the annotation name to the names list
  this.annotation_names.push(annotation);

  // merge the passed annotation with the
  // global list of annotation
  to.merge(this.annotations, {
   [annotation]: {
    alias,
    callbacks
   }
  });

  // a) Merge the current annotation with the `has_alias` object,
  //    and push the alias array onto the global alias array
  if(!is.empty(alias)){
   this.annotation_aliases.push(...alias);
   to.merge(this.has_alias, {
    [annotation]: alias
   });
  }

  return this;
 };

 /// @description
 /// Add an array of annotations
 /// @arg {array} annotations - Annotation objects
 add_annotations(annotations){
  for(let i in annotations){
   this.add(annotations[i]);
  }
 };

 // @name annotations_list
 // @description
 // Gets the list of annotations
 get list(){
  // this.alias_check();
  return this.annotations;
 };

 // @name annotations_list
 // @description
 // Gets the list of annotations
 get names(){
  return this.annotation_names;
 };

 // @name filetype
 // @description
 // This is used to set the current filetype
 // @arg {string}
 set filetype(filetype){
  this.filetype = filetype;
 };

 alias_check(){
  for(let i in this.annotation_names){
   let name = this.annotation_names[i];
   if(is.in(this.annotation_aliases, name)){
    throw new Error(`${name} is already declared as an annotation`);
    return;
   }
  }
 }
};
