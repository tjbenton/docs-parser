"use strict";

// Include Gulp & Tools We'll Use
var gulp = require("gulp"),
    docs = require("./app/lib/js/docs.js");

// This is for the documentation
gulp.task("docs", function(){
 docs.parse("./app/lib/testing-files/**/*.{scss,css}", function(documentation){
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("----------------------------------------------------------------");
  console.log(JSON.stringify(documentation));
 });
});