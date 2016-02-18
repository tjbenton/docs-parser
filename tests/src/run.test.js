/* eslint-disable no-loop-func */

import test from 'tape'
import path from 'path'
import docs from '../../dist/index.js'
import { fs, glob, array } from '../../dist/utils'

const test_defaults = {
  debug: false,
  timestamps: false,
  warning: false,
  changed: false
}


test('case tests', async (mt) => {
  const base = path.join(__dirname, '..', 'cases')
  const actual_paths = await glob(path.join(base, '*'), [ path.join(base, '*.json') ])
  const actual = await array(actual_paths).map((file) => docs({ file, ...test_defaults }))
  const expected = await array(actual_paths).map((file) => fs.readJson(file.replace(/\..*$/, '.json')))

  for (let i = 0; i < actual_paths.length; i++) {
    mt.test(actual_paths[i], (t) => {
      t.deepEqual(
        actual[i],
        expected[i]
      )
      t.end()
    })
  }

  mt.end()
})
