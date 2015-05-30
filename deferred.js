var Deferred = require("deferred-js");
Deferred.when.all = function(deferreds){
 var deferred = new Deferred();
 Deferred.when.apply(null, deferreds)
  .then(function(){
   deferred.resolve(Array.prototype.slice.call(arguments));
  }, function(){
   deferred.fail(Array.prototype.slice.call(arguments));
  });
 return deferred;
};

// Module exports
// a) export module
// b) define amd
// c) add Deferred to the root
if(typeof exports !== "undefined"){
 if(typeof module !== "undefined" && module.exports){
  exports = module.exports = Deferred;
 }
 exports.Deferred = Deferred;
}else if(typeof define === "function" && define.amd){ // AMD definition
 define(function(require){
  return Deferred;
 });
}else{
 root[ "Deferred" ] = Deferred;
}