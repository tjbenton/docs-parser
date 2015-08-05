/// @name chainable
/// @page annotations
/// @description Used to notate that a function is chainable
/// @returns {boolean}
export default {
 chainable: {
  callback: function(){
   return this.annotation.line;
  }
 }
};
