var fs = require("fs"), 
	path = require("path"),
	bcrypt = require('bcrypt'), 
	crypto = require('crypto');
	
	
var lib = function( options ){
	
	var oauth = new OAuth2( options );
	return oauth;
}

var OAuth2 = function( options ){
	
	// pass sessions through the options...
	this.store = options.store || false;
	
}

OAuth2.prototype = {
	
	authorize : function ( req, res, next ) {
		var self = this;
		var err;
		// get info from params
		var client_id = req.query.client_id || false;
		var client_secret = req.query.client_secret || false;
		var redirect_uri = req.query.redirect_uri || false;
		var response_type = req.query.response_type || "code";
 		// get domain info referer
		var referer = req.headers.referer || false;
		var host = req.headers.host || false;
		
		// clear all cases that are erroneous before even going to the db
		if( !client_id ){
			err = { error: "invalid_request", message : "Authentication failed: The request is missing a required parameter, includes an unsupported parameter or parameter value, or is otherwise malformed." };	
			return next(err, false);
		}
		
		if( !referer ){ 
			err = { error: "unauthorized_client", message : "Authentication failed: The client is not authorized to use the requested response type." };
			return next(err, false);
		}
		
		// clean up...
		referer = findDomain(referer);
		
		// send preliminary response back (and expect the database data back)
		next(null, function( data, done ){
			
			if ( !data ){
				err = { error: "invalid_client", message : "Authentication failed: The client identifier provided is invalid." };
				return done( err );
			}
			
			// if more than one (error control?) pick the first one
			data = ( data instanceof Array )? data.shift() : data;
			
			// confirm redirect
			if( redirect_uri ){ 
				var valid = validRedirect( redirect_uri, data.callback );
				if( !valid ){ 
					err = { error: "redirect_uri_mismatch", message : "Authentication failed: The redirection URI provided does not match a pre-registered value." };
					return done( err );
				} 
				redirect = redirect_uri;
			} else {
				// not redirecting
				redirect = false;
			}
	
			
			// check if there's a client secret
			if( client_secret ){
				
				// authenticate based on the secret provided
				bcrypt.compare(client_id, client_secret, function(err, res) {
					if( res == false ) return done({ error: "access_denied", message : "Authentication failed: The end-user or authorization server denied the request." });
					var response = createResponse({ response_type : response_type, redirect : redirect, secret : client_secret });
					return done( response );
				});
				
			} else {
				// authenticate based on the referrer domain
				var valid = checkDomains( referer, data.domains);
				
				if( !valid ){ 
					err = { error: "access_denied", message : "Authentication failed: The end-user or authorization server denied the request." };
					return done( err );
				}
				
				response = createResponse({ response_type : response_type, redirect : redirect, secret : client_secret });
				return done( response );
				
			}
			
		});
		
	},
	
	access_token : function(){
	
	},

	refresh_token : function(){
	
	},

	register : function ( host ) {
		
		// check to see if the key is initialized?
		var creds = createKeyPair( host );
		
		return creds;
	}, 


	reset : function ( host ) {
	
		// remove old key...
		
		// create new key
		var creds = createKeyPair( host );
		
		return creds;
	}, 
	/*
	render: function(res){
		
		res.send( JSON.stringify( res.data ) );
		
	}
	
	*/
}


function createResponse( options ){
	// variables
	var response, err;
	
	// create a new key 
	switch( options.response_type ){
		case "token":
			// return the access token straight away
			response = createToken( options.secret );
			// convert to a URL (if redirecting)
			if( options.redirect ){
				response = options.redirect +"#access_token="+ response.access_token;
			}
		break;
		case "code":
			// create code intead to recieve the access token
			response = createCode( options.secret ); 
			// convert to a URL (if redirecting)
			if( options.redirect ){
				response = options.redirect +"?"+ serialize( response );
			}
		break;
		default: 
			err = { error : "unsupported_response_type", message: "Authentication failed: The requested response type is not supported by the authorization server." };
		break;
	}
	
	if(err) return err;
	// convert to a url if available
	return response;
}


function createCode( secret  ){
	var now = new Date();
	
	var code = crypto.createHash('md5').update("" + secret + now.getTime() ).digest("hex");
	// expire codes after 5 min
	var expires_in = now.getTime() + 300000;
	
	return { code : code, expires_in : expires_in};
}

// generate token by validating the host (domain) and adding the current date (accurate to the month = token resets every month)  
function createToken( secret ){
	var now = new Date();
	
	var access_token = crypto.createHash('md5').update("" + secret + now.getTime() ).digest("hex");
	var expires_in = (new Date(now.getFullYear(), now.getMonth()+1) ).getTime() - now.getTime();
	
	return { access_token : access_token, expires_in : expires_in};
}

function createKeyPair( host ){
	var creds;
	// create the key (unique) based on the date
	creds.key = crypto.createHash('md5').update("" + (new Date()).getTime()).digest("hex");
	// set the config file (create if necessary)
	// create a random generator 
	creds.salt = Math.floor( Math.random()*1000000 );
	//nconf.set("generator", generator);
	// create the secret base on the key + host
	creds.secret = crypto.createHash('md5').update("" + key + host + salt ).digest("hex");
	
	return creds;
}

function validRedirect( request, data ) {
	// this can be better
	var rHost = findDomain(request);
	var rData = findDomain(data);
	// compare...
	return (strpos(rHost, rData) !== false);
}

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

/*
function isValid( key, host ) {
	var salt = "";
	var secret = crypto.createHash('md5').update("" + key + host + salt ).digest("hex");
	
	return ( secret ==  "oldsecret" );
}
*/


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

module.exports = lib;
