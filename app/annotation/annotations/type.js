/// @name type
/// @page annotations
/// @description Describes the type of a variable
/// @returns {string}
export default {
  type: {
    callback() {
      // add regex for `{type} - description`
      return this.annotation.line;
    }
  }
};
