/**
 * OAuth2 - Memory Store
 * - The most simple way of storning tokens; temporarily in memory.
 * Note: Highly inefficient & unreliable - do NOT use in production
**/


var CRUD = function( options ){

	// use the built-in methods
	this.db = db;

}

CRUD.prototype = {

	constructor: CRUD,

	create: function( data, callback ){
		this.db.create( data, callback );
	},

	read: function(query, callback){
		this.db.read( query, callback );
	},

	destroy: function(item, callback){
		this.db.destroy( item, callback );
	}
}

// Helpers
var data = [];

var db = {

	create: function( item, callback ){
		var key = item.access_token || item.code || false;
		if( !key ) return callback(null, false);
		// check if the item exists first?
		data[key] = item;
		return callback(null, true);
	},

	read: function( query, callback ){
		var key = query.access_token || query.code || false;
		if( !key ) return callback(null, false);
		var value = query[key];
		if( data[key] ) return callback(null, data[key]);
		return callback(null, false);
	},

	destroy: function( item, callback ){
		var key = item.access_token || item.code || false;
		if( !key ) return callback(null, false);
		delete data[key];
		// assume only one item for every key
		return callback(null, true);
	}

}


module.exports = CRUD;
