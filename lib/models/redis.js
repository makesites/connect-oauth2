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
		var key = data.token || data.code || false;
		if( !key ) return callback(null, false);
		var expires = parseInt(data.meta.expires) ||86400000; // default one day...
		// if refresh_token, add 60 days...
		if( data.refresh_token) expires += (60 * 86400000);
		// convert ttl to seconds
		var ttl = expires / 1000;
		// stringify data
		data = JSON.stringify(data);
		// connect to store
		this.store.setex( key, ttl, data, function(err, result){
			if(err) return callback(err);
			// error control?
			return callback( null, true );
		});
	},

	read: function( query, callback ){
		var key =  = query.token || query.code || false;
		if( !key ) return callback(null, false);
		// connect to store
		this.store.get( key, function(err, data){
			if(err) return callback(err);
			// parse data into an object
			data = JSON.parse( data.toString() );
			callback( null, data );
		});
	},

	destroy: function( item, callback ){
		var key =  = query.token || query.code || false;
		if( !key ) return callback(null, false);
		// connect to store
		this.store.del( key, function(err, data){
			if(err) return callback(err);
			callback( null, true );
		});
	}

}


module.exports = Model;
