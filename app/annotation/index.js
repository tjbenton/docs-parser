"use strict";

import annotations from "./annotations";
import {is, to} from "../utils.js";

export default class AnnotationApi{
 constructor(){
  // object of the all the annotation
  // This object holds all the annotations
  this.annotations = {
   default: {
    // holds all default annotations for all filetypes that aren't
    // specific to an individual filetype.
   }
   // You can add file specific overrides if you need to. All you have
   // to do is specific the filetype as the key(aka replace default with the filetype)
   // js: {
   //  annotation
   // }
  };

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
 /// @markup {js} **Example:** Declaring a basic annotation
 /// docs.annotation.add("name", function(){
 ///  return this.annotation.line;
 /// });
 ///
 /// @markup {js} **Example:** Declaring a annotation with more options
 /// docs.annotation.add("name", {
 ///  alias: ["title", "heading"],
 ///  callback: function(){
 ///   return this.annotation.line;
 ///  },
 ///  autofill: false,
 ///  resolve: false
 /// });
 ///
 /// @markup {js} **Example** Specifing a file specific annotation
 /// docs.annotation.add("promise", {
 ///  // the filetypes passed will use the `callback` and the other
 ///  // settings in the config. It can be a string or an array of
 ///  // filetypes. Note that if a filetype isn't specificed it defaults
 ///  // to be `"default"` which will apply to all files.
 ///  filetype: ["js", "jsx", "es", "es6", "es7"],
 ///  callback: function(){
 ///   return this.annotation.line;
 ///  },
 ///  ...
 /// });
 ///
 /// @markup {js} **Example** Specifing a file specific annotation(Option 2)
 /// This is very useful
 /// docs.annotation.add("name", {
 ///  default: { // for all filetypes that aren't defined for this annotation
 ///   callback: function(){
 ///    return this.annotation.line;
 ///   },
 ///   ...
 ///  },
 ///  js: { // use the file extention
 ///  }
 /// });
 add(name, config){
  // stores the current annotation that is being added
  // to the annotations list.
  // the name of the annotation is always the key
  const base_config = {
   // this declares where this annotation get's applied
   filetypes: ["default"],

   // holds an array of aliases for the given annotation
   alias: [],

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
   // the issues on the client side. It's also useful if you want want
   // to ensure the data always returns an `array`.
   resolve: false
  };

  // a) throw an error
  if(!is.string(name)){
   throw new Error("name must be a string");
   return;
  }

  // a) set the passed `array` as the `alias`
  // b) set the passed `function` as the `callback` function
  // c) it's a filetype specific `object`
  // d) throw an error
  if(is.array(config)){
   config = {
    alias: config
   };
  }
  else if(is.function(config)){
   config = {
    callback: config
   };
  }
  else if(is.object(config) && !is.empty(config) && !is.any.in(config, ...to.keys(base_config))){
   // loop through each filetype in the passed
   // object and rerun the add function
   for(let filetype in config){
    let obj = config[filetype];
    obj.filetypes = is.in(obj, "filetype") ? to.array.flat([filetype, config.filetype]) : to.array(filetype);
    this.add(name, obj);
   }
   return;
  }
  else if(!is.object(config)){
   throw new Error("config must be a function or object");
   return;
  }

  // merge the passed `config` with the base config
  // to ensure all settings are defined.
  to.merge(base_config, config);

  // merge the passed annotation with the
  // global list of annotations by filetype/default
  for(var filetype in base_config.filetypes){
   to.merge(this.annotations, {
    [is.falsy(base_config.filetypes[filetype]) ? "default" : base_config.filetypes[filetype]]: {
     [name]: base_config
    }
   });
  }

  return this;
 };

 /// @description
 /// Add an array of annotations
 /// @arg {array} annotations - Annotation objects
 add_annotations(annotations){
  for(let name in annotations){
   this.add(name, annotations[name]);
  }
 };

 /// @name list
 /// @description
 /// This gets the annotations to use for the current filetype.
 /// Basically the file specific annotations get extended onto the default annotations
 /// @returns {object} - the annotations to use for the current file
 list(filetype){
  return !is.undefined(this.annotations[filetype]) ? to.extend(to.clone(this.annotations.default), this.annotations[filetype]) : this.annotations.default;
 };

 /// @name file_list
 /// @description Gets the full list of annotations by filetype
 /// @returns {object}
 get file_list(){
  return this.annotations;
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
