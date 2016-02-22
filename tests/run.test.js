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


async function asynctests(tests) {
  const base = path.join(__dirname, 'cases')
  const actual_paths = await glob(path.join(base, '*'), [ path.join(base, '*.json') ])
  const actual = await array(actual_paths).map((files) => docs({ files, ...test_defaults }))
  const expected = await array(actual_paths).map((file) => fs.readJson(file.replace(/\..*$/, '.json')))
  tests({
    actual_paths,
    actual,
    expected
  })
  run()
}

asynctests(({ actual_paths, actual, expected }) => {
  suite('case tests', function() { // eslint-disable-line
    this.timeout(50000) // eslint-disable-line

    for (let i = 0; i < actual_paths.length; i++) {
      test(`${i}: ${actual_paths[i]}`, () => {
        assert.deepStrictEqual(
          actual[i],
          expected[i]
        )
      })
    }
  })
})
