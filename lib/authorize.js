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
		method: options.authorize;
	}
	var self = this;

	function(req, res){
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
		var header = this.req.get('Authorization'); //req.headers.authorization
		if ( header && this.options.method != "rest" ) {
			var matches = header.match(/Bearer\s(\S+)/);
			if( matches ){
				token = matches[1]; // return instead?
			}
		}

		// then look in POST (disable with a flag?)
		if( !token && this.options.method != "bearer" ){
			var postToken = this.req.body ? this.req.body.access_token : false;
			if( postToken ){
				token = postToken; // return instead?
			}
		}

		// then look in GET (disable with a flag?)
		if( !token && this.options.method != "bearer" ){
			var getToken =  this.req.query.access_token || false;
			if( getToken ){
				token = getToken; // return instead?
			}
		}

		// end result
		return token;
	}

};

module.exports = Authorize;