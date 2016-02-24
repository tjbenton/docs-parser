/* eslint-disable no-loop-func */
/* global run */
import path from 'path'
import docs from '../dist/index.js'
import { fs, glob, array, } from '../dist/utils'
import assert from 'assert'

const test_defaults = {
  debug: false,
  timestamps: false,
  warning: false,
  changed: false,
  ignore: '.*'
}


addSuite('cases', async ({ paths, expected }) => {
  const actual = await array(paths).map((files) => docs({ files, ...test_defaults }))

  return () => {
    for (let i = 0; i < paths.length; i++) {
      test(`${i}: ${paths[i]}`, () => {
        assert.deepStrictEqual(
          actual[i],
          expected[i]
        )
      })
    }
  }
})


addSuite('annotations', async ({ paths, expected }) => {
  const actual = await array(paths).map((files) => docs({ files, raw: true, ...test_defaults }))

  return () => {
    for (let i = 0; i < paths.length; i++) {
      let _path = paths[i]
      test(`${i}: ${_path}`, () => {
        assert.deepStrictEqual(
          actual[i]['docs' + _path.split('/docs')[1]],
          expected[i]
        )
      })
    }
  }
})


const mochaAsync = (fn) => { // eslint-disable-line
  return async (done) => {
    try {
      await fn()
      done()
    } catch (err) {
      done(err)
    }
  }
}


async function addSuite(name, folder, callback) {
  if (arguments.length === 2) {
    callback = folder
    folder = name
  }
  let cases, tests

  try {
    // get the test cases
    cases = await getTestCases(folder)
    // run any async stuff if needed before the tests.
    // this `callback` is a curry function so it has to return a function
    tests = await callback({ ...cases })
  } catch (err) {
    console.log(err)
  }
  suite(name, function() { // eslint-disable-line
    this.timeout(50000) // eslint-disable-line
    tests()
  })

  run() // mocha-tests
}

// console.log(addSuite())

async function getTestCases(folder) {
  const base = path.join(__dirname, folder)
  const paths = await glob(path.join(base, '**', '*'), [ path.join(base, '**', '*.json') ])
  return {
    paths,
    expected: await array(paths).map((file) => fs.readJson(file.replace(path.extname(file), '.json')))
  }
}
