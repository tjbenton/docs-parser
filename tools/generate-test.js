#!/usr/bin/env node
/* eslint-disable prefer-arrow-callback, func-names, no-shadow, babel/object-shorthand */
'use strict'


var docs = require('..').default
var path = require('path')
var clor = require('clor')
var utils = require('../dist/utils')
var argv = process.argv.slice(2)

utils.glob(argv, [ 'tests/**/*.json' ])
  .then(function(files) {
    var promises = []
    for (var i = 0; i < files.length; i++) {
      promises.push(sortTest(files[i]))
    }

    return Promise.all(promises)
  })
  .then(function(parsed) {
    for (var i = 0; i < parsed.length; i++) {
      console.log('   ', (i + 1) + ':', parsed[i])
    }
  })



function sortTest(file) {
  var type = file.match(/(?:tests\/)([a-z\-]*)/)[1]

  switch (type) {
    case 'cases':
    case 'file-types':
      return caseTest(file)
    case 'annotations':
      return annotationTest(file)
    default:
      return Promise.resolve(clor.yellow(file + " isn't a test"))
  }
}



function annotationTest(file) {
  return new Promise(function(resolve) {
    docs({
      files: file,
      warning: false,
      debug: false,
      timestamps: false,
      raw: true,
      ignore: '.*'
    })
    .then(function(parsed) {
      return utils.fs.outputJson(
        file.replace(path.extname(file), '.json').replace('docs/', ''),
        parsed[path.join('docs', file)],
        { spaces: 2 }
      )
    })
    .then(function() {
      resolve(clor.green(file) + '')
    })
    .catch(function() {
      resolve(clor.red(file) + '')
    })
  })
}



function caseTest(file) {
  return new Promise(function(resolve) {
    docs({
      files: file,
      warning: false,
      debug: false,
      timestamps: false,
      ignore: '.*'
    })
    .then(function(parsed) {
      return utils.fs.outputJson(
        file.replace(path.extname(file), '.json'),
        parsed,
        { spaces: 2 }
      )
    })
    .then(function() {
      resolve(clor.green(file) + '')
    })
    .catch(function() {
      resolve(clor.red(file) + '')
    })
  })
}
