/// @name markup
/// @page annotations
/// @description Code for the documented item
/// @note Description is parsed as markdown
/// @returns {object}
export default {
  markup: {
    callback() {
      // add regex for `{language} [settings] - description`
      return this.annotation.contents;
    }
  }
};
