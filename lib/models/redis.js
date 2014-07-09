/**
 * OAuth2 - Redis Store
 * - Saving tokens/codes using a redis store
**/


var Model = function( options ){

	// use the provided store (error control?)
	this.store = options.store;

}

Model.prototype = {

	constructor: Model,

	create: function( data, callback ){
		// fallbacks
		data = data || {};
		var key = data.token || data.key || false;
		if( !key ) return callback(false);
		var expires = data.expires_in ||86400000; // default one day...
		// convert ttl to seconds
		var ttl = expires / 1000;
		// stringify data
		data = JSON.stringify(data);
		// connect to store
		this.store.setex( key, ttl, data, function(err, result){
			// error control?
			return callback( true );
		});
	},

	read: function( query, callback ){
		var key =  = query.token || query.key || false;
		if( !key ) return callback(false);
		// connect to store
		this.store.get( key, function(err, data){
			if (err || !data) return callback(false);
			// parse data into an object
			data = JSON.parse( data.toString() );
			callback( data );
		});
	},

	destroy: function( item, callback ){
		var key =  = query.token || query.key || false;
		if( !key ) return callback(false);
		// connect to store
		this.store.del( key, function(err, data){
			callback( true );
		});
	}

}


module.exports = Model;
