let Deferred = require("deferred-js");
Deferred.when.all = function(deferreds){
 let deferred = new Deferred();
 Deferred.when.apply(null, deferreds)
  .then(function(){
   deferred.resolve(Array.prototype.slice.call(arguments))
  }, function(){
   deferred.fail(Array.prototype.slice.call(arguments))
  });
 return deferred;
};

export default Deferred;