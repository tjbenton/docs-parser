"use strict";

var gulp = require("gulp"),
    docs = require("docs");

// This is for the documentation
gulp.task("docs", function(){
 docs
  .parse("lib/**/*.*")
  .then(function(){
   console.log("");
   console.log("");
   console.log("");
   console.log("");
   console.log("-------------------------------------------------------------------");
   console.log(this.data);
  })
  .write("test.json");
});

gulp.task("default", ["docs"]);