#!/usr/bin/env node
/* eslint-disable prefer-arrow-callback, func-names */
'use strict'

var docs = require('..').default
var path = require('path')
var utils = require('../dist/utils')
var argv = process.argv.slice(2).map(function(file_path) {
  return path.join('tests', 'annotations', file_path.replace('tests/annotations', ''))
})

utils.glob(argv, [ 'tests/annotations/**/*.json' ])
  .then(function(files) {
    return docs({
      files,
      changed: false,
      warning: false,
      debug: false,
      timestamps: false,
      raw: true,
      ignore: '.*'
    })
  })
  .then(function(parsed) {
    var promises = []
    for (var file_path in parsed) {
      if (parsed.hasOwnProperty(file_path)) {
        promises.push(
          utils.fs.outputJson(
            file_path.replace(path.extname(file_path), '.json').replace('docs/', ''),
            parsed[file_path],
            { spaces: 2 }
          )
        )
      }
    }
    return Promise.all([
      Promise.resolve(Object.keys(parsed)),
      Promise.all(promises)
    ])
  })
  .then(function(data) {
    console.log('Annotation test cases created for')
    data[0].forEach(function(file_path, i) {
      console.log('   ', (i + 1) + ':', file_path)
    })
  })
