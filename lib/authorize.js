/**
 * OAuth2 Authorize
 * - parses (bearer) token and authorizes an api request
**/

var Authorize = function( options ){
	options = options ||{};
	// prerequisite
	//if( !options.authorize ) return false;
	// save class options
	this.options = {
		method: options.authorize
	}
	var self = this;

	return function(req, res, next){
		var token = self.readToken(req, res);
		var store = this.store; // context coming from the main lib
		// exit now if no token
		if( !token ) return next(false);
		// validate token against store
		store.read({ access_token: token }, function( err, result ){
			// exit now if no result
			if( !result ) return next(false);
			// check token hasn't expired
			var now = (new Date()).getTime();
			if( result.meta.expires < now ){
				store.destroy(result, function( err, result ){ });
				// no need to validate because the request is no go regardless?
				return next(false);
			}
			// persist info
			if( !req.oauth ) req.oauth = {};
			if( !req.oauth.token ) req.oauth.token = token;
			// add other meta data
			req.oauth.expires = result.meta.expires;
			req.oauth.user = result.meta.user || false;
			return next(true);
		});
	}
}

Authorize.prototype = {

	constructor: Authorize,

	// find the token in the request, according to RFC6750
	readToken: function  ( req, res ) {
		var token = false;

		// first look in header
		//console.log( req.headers );
		var header = req.headers.authorization; //req.get('Authorization')
		if ( header && this.options.authorize != "query" ) {
			var matches = header.match(/Bearer\s(\S+)/);
			// alternative way:
			//if((req.headers['authorization'] || '').indexOf('Bearer ') == 0) {
			//token = req.headers['authorization'].replace('Bearer', '').trim();
			if( matches ){
				token = matches[1]; // return instead?
			}
		}

		// then look in POST (disable with a flag?)
		if( !token && this.options.authorize != "bearer" ){
			var postToken = (req.body) ? req.body.access_token : false;
			if( postToken ){
				token = postToken; // return instead?
			}
		}

		//console.log( req.query );
		// then look in GET (disable with a flag?)
		if( !token && this.options.authorize != "bearer" ){
			var getToken = (req.query) ? req.query.access_token : false;
			if( getToken ){
				token = getToken; // return instead?
			}
		}

		//console.log( "token", token );
		// end result
		return token;
	}

};

module.exports = Authorize;
