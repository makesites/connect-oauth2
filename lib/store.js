/**
 * OAuth2 Store
 * - connecting lib with persistent storage
**/


// model
// { token: "", client_id: "", scope: "", expires_in: "" }
// { code: "", client_id: "", scope: "", expires_in: "" }

var Store = function( options ){

	// pick the right store based on the options
	this.model = (typeof options.model == "string") ? require("./stores/"+ options.model ) : options.model;

}

Store.prototype = {

	constructor: Store,

	create: function(){
		this.model.create( data );
	},

	read: function(){
		this.model.read( data );
	},

	destroy: function(){
		this.model.destroy( data );
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