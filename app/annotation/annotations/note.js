/// @name note
/// @page annotations
/// @description A note about the documented item
/// @returns {object}
export default {
 note: {
  callback: function(){
   // add regex for `{7} - A note`
   return this.annotation.line;
  }
 }
};
