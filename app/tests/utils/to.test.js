import test from 'tape';
import to from '../../utils/to.js'
import fs from '../../utils/fs.js'
import info from '../../utils/info.js'
import is from 'is_js'

const string = 'yo this is a string'
const array = ['one', 'two', 'three']
const object = {one: 1, two: 2, three: 3}
const buffer = new Buffer(string)
const number = 4
const boolean = false


test('to.string', (t) => {
  t.is(typeof to.string(string), 'string',
    '`string` should be converted to a typeof string')
  t.is(typeof to.string(array), 'string',
    '`array` should be converted to a typeof string')
  t.is(typeof to.string(buffer), 'string',
    '`buffer` should be converted to a typeof string')
  t.is(typeof to.string(object), 'string',
    '`object` should be converted to a typeof string')
  t.is(typeof to.string(number), 'string',
    '`number` should be converted to a typeof string')
  t.is(typeof to.string(boolean), 'string',
    '`boolean` should be converted to a typeof string')
  t.end()
})


test('to.normal_string', async (t) => {
  try {
    // this file has some stupid ass characters in it
    // that need to be removed in order to become like the
    // rest of the fucking world. #microsoftBlowsAtStandards
    let crappy_windows_file = await fs.readFile(`${info.root}/examples/lib/coffeescript/test.coffee`)
    // crappy_windows_file = JSON.stringify({foo: crappy_windows_file + ''})
    t.is(to.normal_string(crappy_windows_file).match(/\r/g), null,
      'should be a normal string')
    t.end()
  } catch (err) {
    t.fail('the file didn\'t load')
    console.log(err.stack);
    t.end()
  }
})


test('to.keys', (t) => {
  const keys = to.keys(object)
  t.is(keys[0], 'one', 'should return one')
  t.is(keys[1], 'two', 'should return two')
  t.is(keys[2], 'three', 'should return three')
  t.end()
})


test('to.entries', (t) => {
  for (let [i, item] of to.entries(array)) {
    t.ok(typeof i, 'number', '`i` should be a number')
    t.ok(typeof item, 'string', '`i` should be a string')
  }
  t.end()
})


test('to.object_entries', (t) => {
  for (let { key, one, two, three } of to.object_entries({ test: object })) {
    t.is(key, 'test', 'The key should be `test`')
    t.is(one, 1, '`one` should equal 1')
    t.is(two, 2, '`two` should equal 2')
    t.is(three, 3, '`three` should equal 3')
  }
  t.end()
})


test('to.normalize', (t) => {
  const actual = `
    .foo {
      background: blue;
    }
  `;
  const expected = [ '.foo {', '  background: blue;', '}' ].join('\n')

  t.is(to.normalize(actual), expected, 'all whitespace should be stripped')
  t.ok(actual.split('\n')[2].length > 19, 'should be greater than 19')
  t.is(to.normalize(actual).split('\n')[1].length, 19, 'should be 19')
  t.end()
})


test('to.extend', (t) => {
  let temp = to.extend({}, object);
  t.deepEqual(object, object,
    'should equal each other, because they\'re the same')
  t.deepEqual(temp, object,
    'should be the same as the first object')
  t.is(to.extend(temp, {one: 3}).one, 3,
    '`one` should be equal to 3')
  t.end()
})


test('to.clone', (t) => {
  let actual = { one: { two: { three: { four: { five: 'whatup' } } } } }
  let expected = { one: { two: { three: { four: { five: 'whatup' } } } } }
  let test_one = to.clone(actual)
  test_one.test = 'yo'
  t.ok(actual.test === undefined,
    '`acutal.test` should not be defined')
  t.ok(test_one.test === 'yo',
    '`test_one.test` should equal yo')
  t.deepEqual(actual, expected,
    'the actual object should remain the same as the expected object')
  t.end()
})


test('to.merge', (t) => {
  let a = {
    foo: {
      bar: '1',
      baz: ['3', '4'],
      qux: 'one',
      quux: { garply: { waldo: 'one' } }, waldo: ''
    }
  }
  let b = {
    foo: {
      bar: '2',
      baz: ['5', '6'],
      qux: ['two', 'three'],
      quux: { garply: { waldo: 'two' } },
      waldo: function() {
        return this
      },
      garply: 'item'
    }
  }
  let expected = {
    foo: {
      bar: [ '1', '2' ],
      baz: [ '3', '4', '5', '6' ],
      qux: [ 'one', 'two', 'three' ],
      quux: { garply: { waldo: [ 'one', 'two' ] }
    },
    waldo: function() {
      return this
    },
    garply: 'item' }
  }
  t.is(a.foo.bar, '1', 'a.foo.bar should be 1')
  to.merge(a, b)
  t.pass('a and be were merged')
  t.ok(Array.isArray(a.foo.bar), 'a.foo.bar should be an array')
  t.ok(Array.isArray(a.foo.baz), 'a.foo.baz should be an array')
  t.ok(Array.isArray(a.foo.quux.garply.waldo),
    'a.foo.quux.garply.waldo should be an array')
  t.end()
})


test('to.object', async (t) => {
  try {
    let json = await fs.readFile(`${info.root}/package.json`)
    t.ok(to.object(json).author,
      'the passed json should now be an object')
    t.end()
  } catch (err) {
    console.log(err.stack);
  }
})


test('to.json', (t) => {
  let obj = { foo: 'foo', bar: 'foo' }
  t.is(typeof obj, 'object',
    'the test object should be an object')
  t.is(typeof to.json(obj), 'string',
    'should be a json string')
  t.end()
})


test('to.array', (t) => {
  t.ok(Array.isArray(array),
    'array should should be an array')
  t.ok(Array.isArray(to.array(array)),
    'array should be be returned with no changes')
  t.notOk(Array.isArray(string),
    'string should not be an array')
  t.ok(Array.isArray(to.array(string)),
    'string should be converted to a type of array')
  t.notOk(Array.isArray(object),
    'object should not be an array')
  t.ok(Array.isArray(to.array(object)),
    'object should be converted to a type of array')
  t.notOk(Array.isArray(number),
    'number should not be an array')
  t.ok(Array.isArray(to.array(number)),
    'number should be converted to a type of array')
  t.end()
})


test('to.flatten', (t) => {
  t.is(to.flatten([[[array]]])[0], 'one',
    'the array should be flattend and the first value should be one')
  t.end()
})


test('to.unique', (t) => {
  t.is(to.unique(['one', 'one', 'two', 'two']).length, 2,
    'should have a length of 2')
  t.end()
})


test('to.sort', (t) => {
  let actual = {
    c: 1,
    b: 2,
    a: 3
  }

  t.is(Object.keys(actual)[0], 'c',
    'c should be the first key in the object')
  t.is(Object.keys(to.sort(actual))[0], 'a',
    'a should be the first key in the object after it\'s sorted')
  t.end()
})


test('to.number', (t) => {
  t.is(to.number(4), 4,
    'should be 4')
  t.is(to.number([ 'a', 'b', 'c' ]), 3,
    'should be 3')
  t.is(to.number({ a: 1, b: 2, c: 3 }), 3,
    'should be 3')
  t.is(to.number('foo'), 0,
    'should be 0')
  t.is(to.number('10'), 10,
    'should be 10')
  t.is(to.number(false), 0,
    'should be 0')
  t.is(to.number(true), 1,
    'should be 1')
  t.end()
})