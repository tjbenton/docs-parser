/// @name deprecated
/// @page annotations
/// @description Lets you know that a mixin/function has been depricated
/// @returns {string}
export default {
  deprecated: {
    callback() {
      // add regex for `{version} - description`
      return this.annotation.line;
    }
  }
};
