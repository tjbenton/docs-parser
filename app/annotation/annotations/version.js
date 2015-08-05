/// @name version
/// @page annotations
/// @description Describes the type of a variable
/// @returns {string}
export default {
 version: {
  callback: function(){
   // add regex for `{type} - description`
   return this.annotation.line;
  }
 }
};
