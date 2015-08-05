/// @name since
/// @page annotations
/// @description Let's you know what version of the project a something was added
/// @returns {string}
export default {
 since: {
  callback: function(){
   // add regex for `{type} - description`
   return this.annotation.line;
  }
 }
};
