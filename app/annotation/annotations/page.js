/// @name page
/// @page annotations
/// @description The page you want the documented item to be on
/// @returns {string}
export default {
 page: {
  alias: ["group"],
  callback: function(){
   return this.annotation.line;
  }
 }
};
