/// @name description
/// @page annotations
/// @description Description of the documented item
/// @note Runs through markdown
/// @returns {string}
export default {
 description: {
  callback: function(){
   return to.markdown(this.annotation.line ? this.annotation.line + "\n" + this.annotation.contents : this.annotation.contents);
  }
 }
};
