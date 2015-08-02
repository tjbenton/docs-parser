/// @name todo
/// @page annotations
/// @description Things to do related to the documented item
/// @returns {object}
export default {
 todo: {
  callback: function(){
   // add regex for {5} [assignee-one, assignee-two] - Task to be done
   // make sure it supports multiple lines
   return this.annotation.line;
  }
 }
};
