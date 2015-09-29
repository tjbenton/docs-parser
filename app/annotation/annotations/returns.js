/// @name returns
/// @page annotations
/// @description Return from the documented function
/// @returns {string}
export default {
  returns: {
    alias: ["return"],
    callback() { // return
      // add regex for `{type} - description`. Also ensure it supports multiple lines
      return this.annotation.line;
    }
  }
};
