/* eslint-disable no-loop-func */
import path from 'path'
import docs from '../dist/index.js'
import { fs, glob } from '../dist/utils'
import assert from 'core-assert'
import { map } from 'async-array-methods'
import asyncSuite from '../tools/async-suite'

const test_defaults = {
  debug: false,
  timestamps: false,
  warning: false,
  changed: false,
  ignore: '.*'
}


addSuite('cases', async ({ paths, expected }) => {
  const actual = await map(paths, (files) => docs({ files, ...test_defaults }))
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
  const actual = await map(paths, (files) => docs({ files, raw: true, ...test_defaults }))

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

function addSuite(name, folder, callback) {
  if (arguments.length === 2) {
    callback = folder
    folder = name
  }

  return asyncSuite(
    name,
    async () => {
      const base = path.join(__dirname, folder)
      const paths = await glob(path.join(base, '**', '*'), [ path.join(base, '**', '*.json') ])
      return {
        paths,
        expected: await map(paths, (file) => fs.readJson(file.replace(path.extname(file), '.json')))
      }
    },
    callback
  )
}
