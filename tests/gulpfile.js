"use strict";

var gulp = require("gulp"),
    docs = require("docs");

// This is for the documentation
gulp.task("docs", function(){
 docs
  .parse("lib/**/*.styl")
  .then(function(data){
   console.log("");
   console.log("");
   console.log("");
   console.log("");
   console.log("-------------------------------------------------------------------");
   console.log(data);
  })
  // .write("test.json");
});

gulp.task("default", ["docs"]);