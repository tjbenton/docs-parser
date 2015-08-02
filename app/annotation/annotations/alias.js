/// @name alias
/// @page annotations
/// @description Whether the documented item is an alias of another item
/// @returns {string}
export default {
 alias: {
  callback: function(){
   return this.annotation.line;
  }
 }
};
