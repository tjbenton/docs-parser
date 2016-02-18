import test from 'tape'
import is from '../../../../dist/utils/is.js'

test('is.false', (t) => {
  t.notOk(is.false('foo'),
    'should return false if a string is passed')
  t.notOk(is.false(0),
    'should return false if a number is passed')
  t.ok(is.false(false),
    'should return true if false is pased to it')
  t.end()
})

test('is.fn', (t) => {
  t.ok(is.fn(test),
    'should return true if it is passed a function')
  t.notOk(is.fn('foo'),
    'should return false if passed a string')
  t.end()
})

test('is.in', (t) => {
  const array = [ 'one', 'two', 'three' ]
  const object = { one: 1, two: 2, three: 3 }
  const string = 'onetwothree'
  t.ok(is.in(array, 'two'),
    'should return true when the item is in the array')
  t.notOk(is.in(array, 'four'),
    'should return false when the item is not in the array')
  t.ok(is.in(object, 'two'),
    'should return true when the item is in the object')
  t.notOk(is.in(object, 'four'),
    'should return false when the item is not in the object')
  t.ok(is.in(string, 'two'),
    'should return true when the item is in the string')
  t.notOk(is.in(string, 'four'),
    'should return false when the item is not in the string')
  t.end()
})

test('is.all.in', (t) => {
  const array = [ 'one', 'two', 'three' ]
  const object = { one: 1, two: 2, three: 3 }
  const string = 'onetwothree'
  t.ok(is.all.in(array, 'one', 'two'),
    'should return true because all items are in the array')
  t.notOk(is.all.in(array, 'one', 'four'),
    'should return false because one item isn\'t in the array')
  t.ok(is.all.in(object, 'one', 'two'),
    'should return true because all items are in the object')
  t.notOk(is.all.in(object, 'one', 'four'),
    'should return false because one item isn\'t in the object')
  t.ok(is.all.in(string, 'one', 'two'),
    'should return true because all items are in the string')
  t.notOk(is.all.in(string, 'one', 'four'),
    'should return false because one item isn\'t in the string')
  t.end()
})

test('is.any.in', (t) => {
  const array = [ 'one', 'two', 'three' ]
  const object = { one: 1, two: 2, three: 3 }
  const string = 'onetwothree'
  t.ok(is.any.in(array, 'one', 'four'),
    'should return true because one is in the array')
  t.notOk(is.any.in(array, 'four', 'five'),
    'should return false because none of the passed arguments are in the array')
  t.ok(is.any.in(object, 'one', 'four'),
    'should return true because one is in the object')
  t.notOk(is.any.in(object, 'four', 'five'),
    'should return false because none of the passed arguments are in the object')
  t.ok(is.any.in(string, 'one', 'four'),
    'should return true because one is in the string')
  t.notOk(is.any.in(string, 'four', 'five'),
    'should return false because none of the passed arguments are in the string')
  t.end()
})

test('is.plain_object', (t) => {
  t.ok(is.plain_object({}),
    'should return true if passed a {}')
  t.notOk(is.plain_object([]),
    'should return false if passed a []')
  t.notOk(is.plain_object(''),
    'should return false if passed a string')
  t.notOk(is.plain_object(test),
    'should return false if passed a function')
  t.end()
})

test('is.between', (t) => {
  t.ok(is.between(200),
    'should return true because 200 is between 0 and Infinity')
  t.ok(is.between(0),
    'should return true because 0 is between 0 and Infinity')
  t.ok(is.between(-100, -1000),
    'should return true because -100 is between -1000 and infinity')
  t.notOk(is.between(-1),
    'should return false because -1 is not between 0 and infinity')
  t.end()
})

test('is.promise', (t) => {
  async function something_async() {
    return Promise.resolve('some cool stuff');
  }
  t.notOk(is.promise('foo'),
    'should return false because a string is not a promise')
  t.notOk(is.promise(test),
    'should return false because tape is not a promise')
  t.ok(is.promise(something_async()),
    'should return true because something_async is an async function')
  t.ok(is.promise(Promise.resolve('')),
    'should return true because it is a promise')
  t.end()
})

test('is.buffer', (t) => {
  const string = 'foo bar'
  const some_buffer = new Buffer(string)
  t.ok(is.buffer(some_buffer),
    'should return true because it is a buffer')
  t.notOk(is.buffer(string),
    'should return false because a string is not a buffer')
  t.end()
})

test('is.symbol', (t) => {
  const string = 'foo bar'
  t.ok(is.symbol(Symbol(string)),
    'should return true because it is a symbol')
  t.notOk(is.symbol(string),
    'should return false because it is a string')
  t.end()
})
