/**
 * OAuth2 for Connect
 *
 * Initiated by Makis Tracend ( @tracend )
 * Distributed through [Makesites]( http://makesites.org)
 * Released under the [Apache license v2.0](http://makesites.org/licenses/APACHE-2.0/)
**/

var _ = require("underscore"),
	async = require("async"),
	fs = require("fs"),
	path = require("path"),
	querystring = require("querystring"),
	// helpers
	defaults = require('../config/default'),
	error = require('./error'),
	utils = require('./utils'),
	// lib classes
	Authorize = require('./authorize'),
	Routes = require('./routes'),
	Store = require('./store')
	Token = require('./token'),
	Verify = require('./verify');

// instance of class saved here...
var oauth;

var OAuth2 = function( options ){
	// fallbacks
	options = options || {};
	// merge options with defaults
	this.options = _.extend({}, defaults, options);
	// prerequisites
	//if( !store ) return false;
	// pass sessions through the options...
	this.store = new Store( this.options );
	// validate methods
	this.verify = new Verify( this.options );
	this.authorize = new Authorize( this.options );
	this.routes = new Routes( this.options );
	this.token = new Token( this.options );

	// save a reference in the module (mostly for middleware)
	oauth = this;
	// middleware method
	if( this.options.middleware ){
		return middleware;
	} else {
		this;
	}
}

//
var middleware = function(req, res, next){
	// limit processing
	if( oauth.options.routes ){
		var process = oauth.routes.valid(req, res);
		// exit now if not one of the allocated URLs
		if( !process ) return next();
	}
	// lookup token
	oauth.authorize(req, res, function( authorized ){
		// continue if authorized...
		if( authorized ) return next();
		// all unauthorized api requests fail
		if( oauth.routes.isAPI(req, res) ){
			res.data = error("access_denied");
			// exit now displaying error
			return oauth.response( req, res );
		}
		// otherwise process request
		oauth.process(req, res, next);
	});

};


// Methods
OAuth2.prototype = {

	process: function(req, res, next){

		// normalize request
		req = oauth.normal( req );

		//
		var grant_type = getField("grant_type", req);
		var response_type = getField("response_type", req);

		if( grant_type ){
			// switch based on the grant type
			switch( grant_type ){

				case "client_credentials":
					oauth.requestToken(req, res, next);
				break;
				case "authorization_code":
					oauth.accessToken(req, res, next);
				break;
				case "refresh_token":
					oauth.refreshToken(req, res, next);
				break;
				case "password":
					oauth.userLogin(req, res, next);
				break;
				default:
					// end now...
					return next();
				break;
			}
			// no grant_type in following conditions...
		} else if( response_type == "code" ){
			// dialog to authorize user
			oauth.userAuth(req, res, next);
		} else if( response_type == "token" ){
			// implicit authentication (client-side)
			oauth.clientAuth(req, res, next);
		} else {
			// we should be dealing with separate routes...
			var route = oauth.routes.key(req, res);

			switch( route ){

				case "request_token":
					oauth.requestToken(req, res, next);
				break;
				case "access_token":
					oauth.accessToken(req, res, next);
				break;
				case "refresh_token ":
					oauth.refreshToken(req, res, next);
				break;
				case "authorize":
					// user authorization
					oauth.userAuth(req, res, next);
				break;
				default:
					// end now...
					return next();
				break;
			}
		}
		// ultimate response?

	},

	// present dialog for user to authorize the request
	userAuth: function(req, res, next){
		// normalize request (if not already done by middleware)
		if( !this.options.middleware ) req = this.normal( req );
		// variables
		var self = this;
		// - required fields
		var required = requiredFields( ["response_type", "client_id","redirect_uri"], req ); // + not essential: : , scope,

		if( !required ) {
			res.data = error( "missing_parameter", req.oauth.missing );
			return this.response( req, res );
			// execute next?
		}
		// validate fields
		//var valid = validRedirect( redirect_uri, data.callback );
		// variables
		var code;
		var client_id = getField("client_id", req);
		// actions
		var actions = [
			// validate client_id
			function(cb){
				self.verify.clientID(req, res, function( err, result ){
					// error control?
					if( !result ) return cb( error("invalid_client") );
					// continue...
					cb( null );
				});
			},
			// read user info
			function(cb){
				// pass through if no user id is provided, to let the application deal with the dialog
				if( !req.query.user_id) {
					// extend oauth with request params - explicitly define keys to avoid "noise"
					var params = {
						client_id : req.query.client_id,
						response_type : req.query.response_type,
						redirect_uri : req.query.redirect_uri
					};
					req.oauth.params = utils.encode( params, self.options.secret);
					// stop oauth processing here and continue...
					return next();
				}
				// validate id against authority to avoid id injection
				self.verify.userID(req, res, function( err, result ){
					// error control?
					if( !result ) return cb( error("access_denied") );
					// continue...
					cb( null );
				});
			},
			// check that user has accepted the request
			function(cb){
				// user is declining the request
				if( req.query.grant == 0 ) return cb( error("access_denied") );
				// user is granting the request
				// continue...
				cb( null );
			}

		];
		// execute
		async.series( actions, function(err, results){
			// execute next?
			if( err ){
				res.data = err;
				// exit now displaying error
				//return self.response( req, res );
				return self.redirect( req, res );
			}
			// get code ( merge with this method? )
			self.getCode(req, res, next);
		});

	},

	// creates a temporary code (to be exchanged with an access token)
	getCode: function(req, res, next){
		// normalize request (if not already done by middleware)
		if( !this.options.middleware ) req = this.normal( req );
		// variables
		var self = this;
		// - required fields
		var required = requiredFields( ["client_id", "redirect_uri"], req ); // + not essential: : scope

		if( !required ) {
			res.data = error( "missing_parameter", req.oauth.missing );
			return this.response( req, res );
			// execute next?
		}
		// validate fields
		//var valid = validRedirect( redirect_uri, data.callback );
		// variables
		var code;
		var client_id = getField("client_id", req);
		// actions
		var actions = [
			// validate client_id
			function(cb){
				self.verify.clientID(req, res, function( err, result ){
					// error control?
					if( !result ) return cb( error("invalid_client") );
					// continue...
					cb( null );
				});
			},
			// store code
			function(cb){
				var now = (new Date()).getTime();
				// generate code
				code = self.token.code();
				// add meta info
				code.meta = {
					client_id: client_id,
					expires: now + code.expires_in,
					user: req.query.user_id || true // check user id?
				}
				self.store.create( code, function( err, result ){
					// error control?
					cb(null);
				});

			},
			// redirect
			function(cb){
				// ...
				res.data = JSON.parse(JSON.stringify( code )); // clone copy

				// delete meta data
				delete res.data.meta;
				self.redirect( req, res );
				cb( null );
			}

		];
		// execute
		async.series( actions, function(err, results){
			// execute next?
			if( err ){
				res.data = err;
				// exit now displaying error
				return self.response( req, res );
			}
		});
	},

	// generates an access_token based on 'code' (user level)
	accessToken: function(req, res, next){
		// normalize request (if not already done by middleware)
		if( !this.options.middleware ) req = this.normal( req );
		// variables
		var self = this;
		// prerequisites
		// - required fields
		var required = requiredFields( ["client_id", "client_secret", "code", "redirect_uri"], req );
		if( !required ) {
			res.data = error( "missing_parameter", req.oauth.missing );
			return this.response( req, res );
		}
		// variables
		var code, old, token;
		// actions
		var actions = [
			// validate client_id & secret
			function(cb){

				self.verify.clientCreds(req, res, function( err, result ){
					if( !result ) return cb( error("unauthorized_client") );
					// continue...
					cb( null );
				});
			},
			// get code
			function(cb){
				code = getField("code", req);
				//
				self.store.read({ code: code }, function( err, result ){
					// error control
					if( !result ) return cb( error("invalid_code"));
					var client_id = getField("client_id", req);
					if( result.meta.client_id !== client_id ){
						return cb( error("invalid_client") );
					}
					var now = (new Date()).getTime();
					var expired = parseInt( result.meta.expires );
					if( expired < now ){
						return cb( error("expired_access_token") );
					}
					old = result;
					cb(null);

				});

			},
			// create token
			function(cb){
				var now = (new Date()).getTime();
				// generate token
				token = self.token.create( code );
				// transfer meta info
				token.meta = old.meta;
				// update expiry
				token.meta.expires = now + token.expires_in;
				// store
				self.store.create( token, function( err, result ){
					// error control?
					cb(null);
				});

			},
			// delete code
			function(cb){
				//
				self.store.destroy({ code: code }, function( err, result ){
					// error control?
					cb(null);
				});

			},
			// redirect
			function(cb){
				// ...
				res.data = JSON.parse(JSON.stringify( token ));
				// delete meta data
				delete res.data.meta;
				// continue...
				cb( null );
			}

		];
		// execute
		async.series( actions, function(err, results){
			if( err ){
				res.data = err;
				// exit now displaying error
				return self.response( req, res );
			} else {
				self.redirect( req, res );
			}
			// FIX: request should end here - only continue if we really need to (ex. logging)
			// enable through option (disabled by default)
			// next();
		});
	},

	// returns a new access_token
	refreshToken: function(req, res, next){
		// normalize request (if not already done by middleware)
		if( !this.options.middleware ) req = this.normal( req );
		// variables
		var self = this;
		// prerequisites
		// - required fields
		var required = requiredFields( ["client_id", "client_secret", "refresh_token"], req );
		if( !required ) {
			res.data = error( "missing_parameter", req.oauth.missing );
			return this.response( req, res );
		}
		// variables
		var refresh_token, old, token;
		// actions
		var actions = [
			// validate client_id & secret
			function(cb){

				self.verify.clientCreds(req, res, function( err, result ){
					if( !result ) return cb( error("unauthorized_client") );
					// continue...
					cb( null );
				});
			},
			// validate code
			function(cb){

				refresh_token = getField("refresh_token", req);
				//
				self.store.query({ refresh_token: refresh_token }, function( result ){
					// error control
					if( !result ) return cb( error("invalid_refresh_token") );

					// A refresh_token has a validity of 60 days (not 14 as proposed in spec) and can be used only once, a new refresh token will be returned.
					var now = (new Date()).getTime();
					var expired = parseInt( result.meta.expires ) + (60 * 86400000);
					if( expired < now ){
						return cb( error("expired_refresh_token") );
					}
					var client_id = getField("client_id", req);
					if( result.meta.client_id !== client_id ){
						return cb( error("invalid_client") );
					}
					old = result;
					cb(null);
				});
			},
			// generate new token
			function(cb){
				var now = (new Date()).getTime();
				// generate token
				token = self.token.create( refresh_token );
				// add meta info
				token.meta = old.meta;
				// update expiry
				token.meta.expires = now + token.expires_in;
				// store
				self.store.create( token, function( result ){
					// error control?
					cb(null);
				});

			},
			// destroy old token
			function(cb){
				//
				self.store.destroy({ refresh_token: refresh_token }, function( result ){
					// error control?
					cb(null);
				});

			},
			// save data
			function(cb){
				// stringify
				res.data = JSON.parse(JSON.stringify( token ));
				// delete meta data
				delete res.data.meta;
				// continue
				cb( null );
			}

		];
		// execute
		async.series( actions, function(err, results){
			if( err ){
				// displaying error (instead)
				res.data = err;
			}
			// either way, respond
			self.response( req, res );
			// FIX: request should end here - only continue if we really need to (ex. logging)
			// enable through option (disabled by default)
			// next();
		});


	},

	// generates an app-level access token (grant_type: client_credentials)
	requestToken: function(req, res, next){
		// normalize request (if not already done by middleware)
		if( !this.options.middleware ) req = this.normal( req );
		// variables
		var self = this;
		// prerequisites
		// - required fields
		var required = requiredFields( ["client_id", "client_secret"], req ); // optional: scope
		if( !required ) {
			res.data = error( "missing_parameter", req.oauth.missing );
			return this.response( req, res );
		}
		// variables
		var code, token, app;
		// actions
		var actions = [
			// validate client_id & secret
			function(cb){
				self.verify.clientCreds(req, res, function( err, result ){
					if( !result ) return cb( error("unauthorized_client") );
					// continue...
					app = result;
					cb( null );
				});
			},
			// create token
			function(cb){
				var now = (new Date()).getTime();
				var client_id = getField("client_id", req);
				// generate temp code (used as seed)
				code = self.token.code();
				// generate token
				token = self.token.create( code );
				// delete refresh token (not part of the official spec
				delete token.refresh_token;
				// add meta info
				token.meta = {
					client_id: client_id,
					expires: now + token.expires_in,
					user: false, // signifies application-level token
					app: app || null
				}
				// store
				self.store.create( token, function( err, result ){
					// error control?
					cb(null);
				});

			},
			// save data
			function(cb){
				// stringify
				res.data = JSON.parse(JSON.stringify( token ));
				// delete meta data
				delete res.data.meta;
				// continue
				cb( null );
			}

		];
		// execute
		async.series( actions, function(err, results){
			if( err ){
				// displaying error (instead)
				res.data = err;
			}
			// either way, respond
			self.response( req, res );
			// FIX: request should end here - only continue if we really need to (ex. logging)
			// enable through option (disabled by default)
			// next();
		});

	},

	// authenticate a user by using their username/password login
	userLogin: function(req, res, next){
		// normalize request (if not already done by middleware)
		if( !this.options.middleware ) req = this.normal( req );
		// variables
		var self = this;
		// prerequisites
		// - required fields
		var required = requiredFields( ["client_id", "username", "password"], req ); // optional: client_secret
		if( !required ) {
			res.data = error( "missing_parameter", req.oauth.missing );
			return this.response( req, res );
		}
		// variables
		var code, token, user;
		// actions
		var actions = [
			// validate client_id & user creds
			function( done ){
				self.verify.userCreds(req, res, function( err, result ){
					if( !result ) return done( error("unauthorized_client") );
					user = result;
					// continue...
					done( null );
				});
			},
			// create token
			function( done ){
				var now = (new Date()).getTime();
				var client_id = getField("client_id", req);
				// generate temp code (used as seed)
				code = self.token.code();
				// generate token
				token = self.token.create( code );
				// delete refresh token (not part of the official spec
				delete token.refresh_token;
				// add meta info
				token.meta = {
					client_id: client_id,
					expires: now + token.expires_in,
					user: user // save user id for subsequent verification
				}
				// store
				self.store.create( token, function( err, result ){
					// error control?
					done(null);
				});

			},
			// respond
			function( done ){
				// ...
				res.data = JSON.parse(JSON.stringify( token ));
				// delete meta data
				delete res.data.meta;
				// continue
				done( null );
			}

		];
		// execute
		async.series( actions, function(err, results){
			if( err ){
				// return error
				res.data = err;
			}
			// respond based if a redirect_uri exists
			var redirect_uri = getField("redirect_uri", req); // also: req.query.redirect_uri
			if( redirect_uri ){
				return self.redirect( req, res );
			} else {
				return self.response( req, res );
			}
			// FIX: request should end here - only continue if we really need to (ex. logging)
			// enable through option (disabled by default)
			// next();
		});

	},

	// implicit authentication (client-side)
	clientAuth: function(req, res, next){
		// normalize request (if not already done by middleware)
		if( !this.options.middleware ) req = this.normal( req );
		// variables
		var self = this;
		// - required fields
		var required = requiredFields( ["response_type", "client_id","redirect_uri"], req ); // optional: scope

		if( !required ) {
			res.data = error( "missing_parameter", req.oauth.missing );
			return this.response( req, res );
			// execute next?
		}
		// validate fields
		//var valid = validRedirect( redirect_uri, data.callback );
		// variables
		var code, token;
		var client_id = getField("client_id", req);
		// actions
		var actions = [
			// validate client_id
			function(cb){
				self.verify.implicitCreds(req, res, function( err, result ){
					// error control?
					if( !result ) return cb( error("invalid_client") );
					// continue...
					cb( null );
				});
			},
			// read user info
			function(cb){
				// pass through if no user id is provided, to let the application deal with the dialog
				if( !req.query.user_id) {
					// extend oauth with request params - explicitly define keys to avoid "noise"
					var params = {
						client_id : req.query.client_id,
						response_type : req.query.response_type,
						redirect_uri : req.query.redirect_uri
					};
					req.oauth.params = utils.encode( params, self.options.secret);
					return next();
				}
				// validate id against authority to avoid id injection
				self.verify.userID(req, res, function( err, result ){
					// error control?
					if( !result ) return cb( error("access_denied") );
					// continue...
					cb( null );
				});
			},
			// check that user has accepted the request
			function(cb){
				// user is declining the request
				if( req.query.grant == 0 ) return cb( error("access_denied") );
				// user is granting the request
				// continue...
				cb( null );
			},
			// create token
			function(cb){
				var now = (new Date()).getTime();
				var client_id = getField("client_id", req);
				// generate temp code (used as seed)
				code = self.token.code();
				// generate token
				token = self.token.create( code );
				// delete refresh token ( not part of the official spec )
				delete token.refresh_token;
				// add meta info
				token.meta = {
					client_id: client_id,
					expires: now + token.expires_in,
					user: req.query.user_id // save user id for subsequent verification
				}
				// store
				self.store.create( token, function( err, result ){
					// error control?
					cb(null);
				});

			},
			// respond
			function(cb){
				// ...
				res.data = JSON.parse(JSON.stringify( token ));
				// delete meta data
				delete res.data.meta;
				//
				self.redirect( req, res );
				// do we need to continue?
				cb( null );
			}

		];

		// execute
		async.series( actions, function(err, results){
			// execute next?
			if( err ){
				res.data = err;
				// exit now displaying error
				//return self.response( req, res );
				return self.redirect( req, res );
			}
			// get access token ( one step )
			self.accessToken(req, res, next);
		});

	},


	// Internal

	// displays a response in json format
	response: function( req, res ){
		//
		var data = res.data || false;
		// prerequisite
		if( !data ) return res.end();

		if ( res.data.error ){
			//res.set(data.code);
			//res.send( data.code, JSON.stringify( data ) );
			res.writeHead(data.code);
			res.end( JSON.stringify( data ) );
		} else {
			// valid response
			//res.writeHead(200, {'Content-Type':'application/x-www-form-urlencoded'});
			//res.send( 200, JSON.stringify( data ) );
			res.writeHead(200, {'Content-type': 'application/json'});
			res.end( JSON.stringify( data ) );
		}
	},

	redirect : function( req, res ){
		//
		var data = res.data || false;
		// prerequisite
		if( !data ) return res.end();

		//console.log( "redirect", data );
		var url;
		var redirect_uri = getField("redirect_uri", req);

		// client-side auth
		switch ( req.query.response_type ){
			case "token":
				url = redirect_uri +"#"+ serialize( data );
			break;
			default:
				url = redirect_uri +"?"+ serialize( data );
			break;
		}

		// cover vanilla connect...
		if( res.redirect ){
			res.redirect( url );
		} else {
			res.writeHead(307, {'Location': url });
			res.end();
		}

	},

	// normalize request - check for necessary containers
	normal: function( req ){
		// prerequisites
		if( !req.oauth ) req.oauth = {};
		if( !req.body ) req.body = {};
		// FIX: manually parse query string...
		if( !req.query ) req.query = (  req._parsedUrl.query ) ? parseQuery( req._parsedUrl.query ) : {};
		// special case for code grant
		if( req.query.oauth_params ){
			// decode oauth string
			var params = utils.decode( req.query.oauth_params, this.options.secret );
			req.query = _.extend({}, req.query, JSON.parse(params) );
			// delete params
			delete req.query.oauth_params;
		}
		// continue...
		return req;
	}

}


// Helpers

function requiredFields( fields, req ){
	// variables
	var body = req.body || [];
	var query = req.query || [];
	var result = true;
	//
	fields.forEach(function( field ){
		// stop if not found a field already...
		if( !result ) return;
		//
		var value = body[field] || query[field] || false;
		// exit straight away
		if( !value ){
			// saving value for later...
			req.oauth.missing = field;
			result = false;
		}
	});
	return result;
}

// a complementary method to the above
function getField( field, req ){
	var body = req.body || [];
	var query = req.query || [];
	return body[field] || query[field] || false;
}


function validRedirect( request, data ) {
	// this can be better
	var rHost = findDomain(request);
	var rData = findDomain(data);
	// compare...
	return (strpos(rHost, rData) !== false);
}


// get domain info referer
//this.referer = req.headers.referer || false;
//this.host = req.headers.host || false;

function checkDomains( domain, domains ) {
	// assuming the domina is cleaned up domain first...
	return( domains.indexOf(domain) > -1);
}

function findDomain( str ){
	// remove protocol
	str = str.replace(/http:\/\/|https:\/\//, "");
	// check if there's a path
	var path = str.indexOf("/");
	// remove path (wrong?)
	if( path > -1 )
		str = str.substring( 0 , path );
	return str;
}

function parseQuery( query ){
	return querystring.parse( query );
}

// Helpers
strpos = function(haystack, needle, offset) {
	var i = (haystack+'').indexOf(needle, (offset || 0));
	return i === -1 ? false : i;
}

serialize = function(obj, prefix) {
	var str = [];
	for(var p in obj) {
		var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
		str.push(typeof v == "object" ?
			serialize(v, k) :
			encodeURIComponent(k) + "=" + encodeURIComponent(v));
	}
	return str.join("&");
}


// export

module.exports = function( options ){

	var lib = new OAuth2( options );
	return lib;

};

