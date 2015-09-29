/// @name readonly
/// @page annotations
/// @description To note that a property is readonly
/// @returns {boolean}
export default {
  readonly: {
    callback() {
      return this.annotation.line;
    }
  }
};
