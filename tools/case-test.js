#!/usr/bin/env node
/* eslint-disable prefer-arrow-callback, func-names */
'use strict'


var docs = require('..').default
var path = require('path')
var utils = require('../dist/utils')
var argv = process.argv.slice(2).map(function(file_path) {
  return path.join('tests', 'cases', file_path.replace('tests/cases', ''))
})

var file_paths

utils.glob(argv, [ 'tests/cases/**/*.json' ])
  .then(function(files) {
    file_paths = files
    var result = []
    for (var i = 0; i < files.length; i++) {
      result.push(
        docs({
          files: files[i],
          changed: false,
          warning: false,
          debug: false,
          timestamps: false,
          ignore: '.*'
        })
      )
    }

    return Promise.all(result)
  })
  .then(function(parsed) {
    var promises = []
    for (var i = 0; i < file_paths.length; i++) {
      var file = file_paths[i]
      utils.fs.outputJson(
        file.replace(path.extname(file), '.json'),
        parsed[i],
        { spaces: 2 }
      )
    }

    return Promise.all([
      Promise.resolve(file_paths),
      Promise.all(promises)
    ])
  })
  .then(function(data) {
    console.log('Case test created for:')
    data[0].forEach(function(file_path, i) {
      console.log('   ', (i + 1) + ':', file_path)
    })
  })
