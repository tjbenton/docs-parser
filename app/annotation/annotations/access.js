/// @name access
/// @page annotations
/// @description Access of the documented item
/// @returns {string}
export default {
 access: {
  callback: function(){
   return this.annotation.line;
  }
 }
};
