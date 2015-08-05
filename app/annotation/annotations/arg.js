/// @name arg
/// @page annotations
/// @description Parameters from the documented function/mixin
/// @note Description runs through markdown
/// @returns {object}
export default {
 arg: {
  alias: ["argument", "param", "parameter"],
  callback: function(){ //
   // add regex for `{type} name-of-variable [default value] - description`
   // make sure it supports multiple lines
   return this.annotation.line;
  }
 }
};
