module.exports.deleteItemsbyKey = function(keys, obj) {
    if (keys instanceof Array) {
    	keys.forEach(function(element){
	      delete obj[element];
	    });
    }
}