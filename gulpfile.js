"use strict";
var fs = require("fs");
function readFile(path){
 var file = fs.readFileSync(path);
 return file ? JSON.parse(file) : false;
}

// Include Gulp & Tools We'll Use
var pkg = readFile("./package.json"),
    bower = readFile("./.bowerrc"),
    gulp = require("gulp"),
    del = require("del"),
    browserSync = require("browser-sync"),
    reload = browserSync.reload,
    info = pkg.info,
    app = info.app,
    paths = info.paths,
    docs = require("./app/lib/js/docs.js");
// console.log(docs);

// adds the bower path to the paths object
paths["bower"] = bower.directory ? bower.directory : "bower_components/";

// This is for the documentation
gulp.task("docs", function(){
 // Run the DSS Parser on the file contents
 // dss.parse( fileContents, {}, function(parsedObject){
 //  // Output the parsed document
 //  console.log(parsedObject);
 // });
 //
 docs.parse("./app/lib/testing-files/scss/_test.scss", function(obj){

 });
});