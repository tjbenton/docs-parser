import test from 'tape'
import { author } from '../../annotations'


test('author test yo', (t) => {
  console.log(author);
  t.pass('yo bitch')
  t.end()
})