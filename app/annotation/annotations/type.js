/// @name type
/// @page annotations
/// @description Describes the type of a variable
/// @returns {string}
export default {
 type: {
  callback: function(){
   // add regex for `{type} - description`
   return this.annotation.line;
  }
 }
};
