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

	return function(req, res){
		var token = self.readToken(req, res);
		// persist info
		if( !req.oauth ) req.oauth = {};
		if( !req.oauth.token ) req.oauth.token = token;
		return ( token ) ? true : false;
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
		if ( header && this.options.method != "rest" ) {
			var matches = header.match(/Bearer\s(\S+)/);
			// alternative way:
			//if((req.headers['authorization'] || '').indexOf('Bearer ') == 0) {
			//token = req.headers['authorization'].replace('Bearer', '').trim();
			if( matches ){
				token = matches[1]; // return instead?
			}
		}

		// then look in POST (disable with a flag?)
		if( !token && this.options.method != "bearer" ){
			var postToken = (req.body) ? req.body.access_token : false;
			if( postToken ){
				token = postToken; // return instead?
			}
		}

		//console.log( req.query );
		// then look in GET (disable with a flag?)
		if( !token && this.options.method != "bearer" ){
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
