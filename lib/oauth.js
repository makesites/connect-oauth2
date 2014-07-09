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
	defaults = require('./options'),
	error = require('./error'),
	// lib classes
	Authorize = require('./authorize'),
	Routes = require('./routes'),
	Store = require('./store')
	Token = require('./token'),
	Verify = require('./verify');

// instance of class staved here...
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
	var authorized = oauth.authorize(req, res);
	// prerequisites
	// stop processing if already authorized or there is no data to process
	//if( authorized || (!grant_type && !response_type) ) return next();
	if( authorized ) return next();
	// prerequisites
	if( !req.oauth ) req.oauth = {};
	if( !req.body ) req.body = {};
	// FIX: manually parse query string...
	if( !req.query && req._parsedUrl.query ) req.query = parseQuery( req._parsedUrl.query );
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
			case "refresh_token ":
				oauth.refreshToken(req, res, next);
			break;
			case "password":
				// not implemented yet!
				// support non standard OAUTH2 flow using username/password ?
				return next();
			break;
			default:
				// end now...
				return next();
			break;
		}
	} else if( response_type == "code" ){
		// no grant_type in this case...
		oauth.getCode(req, res, next);
	} else {
		// we should be dealing with routes...
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
				// this can be either getCode or password?
				oauth.getCode(req, res, next);
			break;
			default:
				// end now...
				return next();
			break;
		}
	}
	// ultimate response?
}



OAuth2.prototype = {

	// creates a temporary code (to be exchanged with an access token)
	getCode: function(req, res, next){
		var self = this;
		// - required fields
		var required = requiredFields( ["response_type", "client_id", "redirect_uri"], req ); // + not essential: : scope

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
					user: true // replace with user id...
				}
				self.store.create( code, function( err, result ){
					// error control?
					cb(null);
				});

			},
			// redirect
			function(cb){
				// ...
				res.data = code;
				self.redirect( req, res );
				cb( null );
			}

		];
		// execute
		async.series( actions, function(err, results){
			// execute next?
			if( err ){
				res.data = err;
				// exit now wisplaying error
				return self.response( req, res );
			}
		});
	},

	// generates an access_token based on 'code' (user level)
	accessToken: function(req, res, next){
		var self = this;
		// prerequisites
		// - required fields
		var required = requiredFields( ["client_id", "client_secret", "code", "redirect_uri"], req );
		if( !required ) {
			res.data = error( "missing_parameter", req.oauth.missing );
			return this.response( req, res );
		}
		// variables
		var code, oldItem, token;
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
					oldItem = result;
					cb(null);

				});

			},
			// create token
			function(cb){
				var now = (new Date()).getTime();
				// generate token
				token = self.token.create( code );
				// transfer meta info
				token.meta = oldItem.meta;
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
				res.data = token;
				self.redirect( req, res );
				cb( null );
			}

		];
		// execute
		async.series( actions, function(err, results){
			if( err ){
				res.data = err;
				// exit now wisplaying error
				return self.response( req, res );
			}
			// execute next?
			next();
		});
	},

	// returns a new access_token
	refreshToken: function(req, res, next){

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
				self.store.read({ refresh_token: refresh_token }, function( result ){
					// error control
					if( !result ) return cb( error("invalid_refresh_token") );

					// A refresh_token has a validity of 60 days (not 14 as proposed in spec) and can be used only once, a new refresh token will be returned.
					var now = (new Date()).getTime();
					var expired = parseInt( result.meta.expires ) + (60 * 86400000);
					if( expired < now ){
						cb( error("expired_refresh_token") );
					}
					var client_id = getField("client_id", req);
					if( result.meta.client_id !== client_id ){
						cb( error("invalid_client") );
					}
					old = result;
					cb(null);
				});
			},
			// generate new token
			function(cb){
				// generate token
				token = self.token.create( refresh_token );
				// add meta info
				token.meta = old.meta;
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

			}
		];
		// execute
		async.series( actions, function(err, results){
			if( err ){
				res.data = err;
				// exit now wisplaying error
				return self.response( req, res );
			}
			// execute next?
			next();
		});


	},

	// generates an app-level access token
	requestToken: function(req, res, next){
		// required fields

		// validate code
		// validate client_id & secret
		// generate token
	},

	authorize : function ( req, res, next ) {
		/*
		var self = this;
		var err;
		// get info from params
		this.client_id = req.query.client_id || false;
		this.client_secret = req.query.client_secret || false;
		this.redirect_uri = req.query.redirect_uri || false;
		this.response_type = req.query.response_type || "code";
		// clear all cases that are erroneous before even going to the db
		if( !this.client_id ){
			err = ;
			return next(err, false);
		}

		if( !this.referer ){
			err = ;
			return next(err, false);
		}

		// clean up...
		this.referer = findDomain(this.referer);

		// send preliminary response back (and expect the database data back)
		next(null, function( data, done ){

			var response,
				url = false;

			if ( !data ){
				err = ;
				return done( err );
			}

			// confirm redirect
			if( self.redirect_uri ){

				if( !valid ){
					err = ;
					return done( err );
				}
			} else {

			}


			// check if there's a client secret
			if( self.client_secret ){

				// authenticate based on the secret provided
				bcrypt.compare(self.client_id, self.client_secret, function(err, res) {
					if( res == false ) return done();
					response = self.response();
					// convert to a URL (if redirecting)
					if( this.redirect_uri ){
						url = self.redirect( response );
					}
					return done( response, url );
				});

			} else {
				// authenticate based on the referrer domain
				var valid = checkDomains( self.referer, data.domains);

				if( !valid ){
					err = ;
					return done( err, false );
				}

				response = self.response();
				// convert to a URL (if redirecting)
				if( this.redirect_uri ){
					url = self.redirect( response );
				}
				return done( response, url );

			}

		});
	*/
	},

	// displays a response in json format
	response: function( req, res ){
		//
		var data = res.data || false;
		// prerequisite
		if( !data ) return res.end();
		console.log( "response", data );

		if ( res.data.error ){
			//res.set(data.code);
			//res.send( data.code, JSON.stringify( data ) );
			res.end( JSON.stringify( data ) );
		} else {
			// valid response
			//res.writeHead(200, {'Content-Type':'application/x-www-form-urlencoded'});
			//res.send( 200, JSON.stringify( data ) );
			res.end( JSON.stringify( data ) );
		}
	},

	redirect : function( req, res ){
		//
		var data = res.data || false;
		// prerequisite
		if( !data ) return res.end();

		console.log( "redirect", data );

		var redirect_uri = getField("redirect_uri", req);

		// client-side auth
		// case "token":
		//response = this.redirect_uri +"#access_token="+ response.access_token;

		var url = redirect_uri +"?"+ serialize( data );
		// cover vanilla connect...
		if( res.redirect ){
			res.redirect( url );
		} else {
			res.writeHead(307, {'Location': url });
			res.end();
		}

	}

}


// Helpers

function requiredFields( fields, req ){
	var body = req.body || [];
	var query = req.query || [];
	var result = true;
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

