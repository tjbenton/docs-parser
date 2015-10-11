var docs = require('./dist/docs')

// Module exports
// a) export module
// b) define amd
// c) add docs to the root
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = docs;
  }
  exports.docs = docs;
} else if (typeof define === 'function' && define.amd) { // AMD definition
  define(function(require) {
    return docs;
  });
} else {
  root['docs'] = docs;
}