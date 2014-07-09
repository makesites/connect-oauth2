/**
 * OAuth2 Store
 * - connecting lib with persistent storage
**/

// data examples:
// { token: "", client_id: "", scope: "", expires_in: "" }
// { code: "", client_id: "", scope: "", expires_in: "" }

var Store = function( options ){

	// pick the right store based on the options
	var Model = (typeof options.model == "string") ? require("./models/"+ options.model ) : options.model;
	this.db = new Model( options );

}

Store.prototype = {

	constructor: Store,

	create: function( data, callback ){
		this.db.create( data, function( err, result ){
			if( err ) return callback( err );
			// error control?
			callback( null, result );
		});
	},

	read: function( query, callback ){
		this.db.read( query, function( err, result ){
			if( err ) return callback( err );
			// error control?
			callback( null, result );
		});
	},

	destroy: function( item, callback ){
		this.db.destroy( item, function( err, result ){
			if( err ) return callback( err );
			// error control?
			callback( null, result );
		});
	}
}

/*
// Helpers
var Model = function( token ){


	return {
		token: token,
		expires: (new Date()).getTime() +
	}
}


	// resets the store api for a custom store
	setCustomStore: function( db ){
		this.store = db;
	},
*/


module.exports = Store;