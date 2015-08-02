/// @name constructor
/// @page annotations
/// @description Describes the type of a variable
/// @returns {boolean}
export default {
 construct: {
  alias: ["constructor"],
  callback: function(){
   return this.annotation.line;
  }
 }
};
