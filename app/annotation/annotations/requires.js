/// @name requires
/// @page annotations
/// @description Requirements from the documented item
/// @returns {object}
export default {
 requires: {
  alias: ["require"],
  callback: function(){
   // add regex for {type} item - description
   return this.annotation.line;
  }
 }
};
