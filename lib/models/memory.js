/**
 * OAuth2 - Memory Store
 * - The most simple way of storning tokens; temporarily in memory.
 * Note: Highly inefficient & unreliable - do NOT use in production
**/


var Model = function( options ){

	// use the built-in methods
	this.store = store;

}

Model.prototype = {

	constructor: Model,

	create: function( data, callback ){
		this.store.create( data, callback );
	},

	read: function(query, callback){
		this.store.read( query, callback );
	},

	destroy: function(item, callback){
		this.store.destroy( item, callback );
	}
}

// Helpers
var data = [];

var store = {

	create: function( item, callback ){
		var key = item.token || item.code || false;
		if( !key ) return callback(null, false);
		// check if the item exists first?
		data[key] = item;
		return callback(null, true);
	},

	read: function( query, callback ){
		for( var key in query ){
			var value = query[key];
			for( var i in data ){
				var item = data[i];
				if( item[key] && item[key] == value ) return callback(null, item);
			}
		}
		return callback(null, false);
	},

	destroy: function( item, callback ){
		var key = item.token || item.code || false;
		if( !key ) return callback(null, false);
		delete data[key];
		// assume only one item for every key
		return callback(null, true);
	}

}


module.exports = Model;
