/// @name version
/// @page annotations
/// @description Describes the type of a variable
/// @returns {string}
export default {
  version: {
    callback() {
      // add regex for `{type} - description`
      return this.annotation.line;
    }
  }
};
