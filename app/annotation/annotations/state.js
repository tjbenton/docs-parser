/// @name state
/// @page annotations
/// @description A state of a the documented item
/// @returns {object}
export default {
  state: {
    callback() {
      // add regex for `modifier - description`
      // should consider supporting multiple lines
      // should `modifier` change to be `{modifier}` since it's sorta like `type`?
      return this.annotation.line;
    }
  }
};
