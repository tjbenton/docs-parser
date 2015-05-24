"use strict";

var gulp = require("gulp"),
    docs = require("docs");

// This is for the documentation
gulp.task("docs", function(){
 docs.parse("lib/**/*.{scss,css}", function(documentation){
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("----------------------------------------------------------------");
  console.log(JSON.stringify(documentation));
 });
});