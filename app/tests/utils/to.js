import test from 'tape';
import to from '../../utils/to.js'
import is from '../../utils/is.js'

test('to.string', (t) => {
  const string = to.string('yo this is a string')
  const array = to.string(['foo', 'bar', 'baz'])
  const object = to.string({foo: 1, bar: 2, baz: 3})
  const buffer = new Buffer('yo this is a string')
  const number = to.string(4)
  const boolean = to.string(false)
  // console.log(is.string(buffer));
  t.equal(typeof string, 'string', '`string` should be converted to a typeof string')
  t.equal(string, 'yo this is a string', 'The passed string should not be changed')
  t.equal(typeof array, 'string', '`array` should be converted to a typeof string')
  // t.equal(typeof buffer, 'string', '`buffer` should be converted to a typeof string')
  t.equal(typeof object, 'string', '`object` should be converted to a typeof string')
  t.equal(typeof number, 'string', '`number` should be converted to a typeof string')
  t.equal(typeof boolean, 'string', '`boolean` should be converted to a typeof string')

  t.end()
})

// test('Assertions with tape.', (assert) => {
//   const expected = 'something to test';
//   const actual = 'sonething to test';
//
//   assert.equal(actual, expected,
//     'Given two mismatched values, .equal() should produce a nice bug report');
//
//   assert.end();
// })