/**
 * OAuth Verify
 * - tests if security credentials are valid
**/

var Verify = function( options ){
	options = options ||{};
	// prerequisite
	//if( !options.authority ) return false;
	// save app authority (fallback always validates)
	this.authority = options.authority || function(data, callback){
		callback(true);
	};

	return this;
}

Verify.prototype = {

	constructor: Verify,

	// verifies client_id
	clientID: function(req, res, next){
		var client_id = req.body.client_id || req.query.client_id || false;
		// prerequisites
		if( !client_id ) return next(null, false);
		// process
		this.authority({ client_id: client_id }, function( valid ){
			//
			if( valid ){
				next(null, true);
			} else {
				// display error
				next(null, false);
			}
		});
	},

	// verifies both client_id and secret
	clientCreds: function(req, res, next){
		var client_id = req.body.client_id || req.query.client_id || false;
		var client_secret = req.body.client_secret || req.query.client_secret || false;
		// prerequisites
		if( !client_id || !client_secret ) return next(null, false);
		// process
		this.authority({ client_id: client_id, client_secret: client_secret }, function( valid ){
			//
			if( valid ){
				next(null, true);
			} else {
				// display error
				next(null, false);
			}
		});
	},

	// verify username / password (for grant type "password")
	userCreds: function(req, res, next){
		var client_id = req.body.client_id || req.query.client_id || false;
		var username = req.body.username || req.query.username || false;
		var password = req.body.password || req.query.password || false;
		// prerequisites
		if( !client_id || !username || !password ) return next(null, false);
		// process
		this.authority({ client_id: client_id, username: username, password: password }, function( valid ){
			//
			if( valid ){
				next(null, true);
			} else {
				// display error
				next(null, false);
			}
		});
	},

	// verifies user_id (against session)
	userID: function(req, res, next){
		var user_id = req.query.user_id || false;
		// prerequisites
		if( !user_id ) return next(null, false);
		// process
		this.authority({ user_id: user_id }, function( valid ){
			//
			if( valid ){
				next(null, true);
			} else {
				// display error
				next(null, false);
			}
		});
	}

};


module.exports = Verify;
