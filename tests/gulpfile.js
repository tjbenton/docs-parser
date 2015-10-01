"use strict";

var gulp = require("gulp"),
    docs = require("docs"),
    path = require("path");

// This is for the documentation
gulp.task("docs", function() {
  docs.parse("lib/**/*")
    .then(function(result) {
      console.log(docs.to.json(result.sorted));
      docs.fs.outputJson("./test.json", result.sorted, {
        spaces: 2
      }, 1);
    });
});

gulp.task("default", ["docs"]);