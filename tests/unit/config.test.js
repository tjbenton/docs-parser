/* eslint-disable no-unused-vars */
import assert from 'core-assert'
import asyncSuite from '../../tools/async-suite.js'
import getConfig, {
  parseComments,
  default_options,
  default_comment,
  comments,
  base_config
} from '../../app/config'

asyncSuite('config', () => {
  return () => {
    test('parseComments empty', () => {
      assert.deepStrictEqual(
        parseComments({
          test: {}
        }).test,
        default_comment
      )
    })

    test('parseComments extend', () => {
      let test = parseComments({
        rb: {
          header: { start: '###', line: '##', end: '###' },
          body: { line: '#' }
        },
        py: {
          extend: 'rb'
        }
      })
      assert.equal(test.rb.header.start, test.py.header.start)
      assert.equal(test.rb.header.line, test.py.header.line)
      assert.equal(test.rb.header.end, test.py.header.end)
      assert.equal(test.rb.body.start, test.py.body.start)
      assert.equal(test.rb.body.line, test.py.body.line)
      assert.equal(test.rb.body.end, test.py.body.end)
    })
  }
})
