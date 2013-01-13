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
		this.client_id = req.query.client_id || false;
		this.client_secret = req.query.client_secret || false;
		this.redirect_uri = req.query.redirect_uri || false;
		this.response_type = req.query.response_type || "code";
 		// get domain info referer
		this.referer = req.headers.referer || false;
		this.host = req.headers.host || false;
		
		// clear all cases that are erroneous before even going to the db
		if( !this.client_id ){
			err = { error: "invalid_request", message : "Authentication failed: The request is missing a required parameter, includes an unsupported parameter or parameter value, or is otherwise malformed." };	
			return next(err, false);
		}
		
		if( !this.referer ){ 
			err = { error: "unauthorized_client", message : "Authentication failed: The client is not authorized to use the requested response type." };
			return next(err, false);
		}
		
		// clean up...
		this.referer = findDomain(this.referer);
		
		// send preliminary response back (and expect the database data back)
		next(null, function( data, done ){
			
			var response, 
				url = false;
			
			if ( !data ){
				err = { error: "invalid_client", message : "Authentication failed: The client identifier provided is invalid." };
				return done( err );
			}
			
			// confirm redirect
			if( self.redirect_uri ){ 
				var valid = validRedirect( self.redirect_uri, data.callback );
				if( !valid ){ 
					err = { error: "redirect_uri_mismatch", message : "Authentication failed: The redirection URI provided does not match a pre-registered value." };
					return done( err );
				} 
			} else {
				
			}
	
			
			// check if there's a client secret
			if( self.client_secret ){
				
				// authenticate based on the secret provided
				bcrypt.compare(self.client_id, self.client_secret, function(err, res) {
					if( res == false ) return done({ error: "access_denied", message : "Authentication failed: The end-user or authorization server denied the request." });
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
					err = { error: "access_denied", message : "Authentication failed: The end-user or authorization server denied the request." };
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
	
	response : function(){
		// variables
		var response, err;
		
		// create a new key 
		switch( this.response_type ){
			case "token":
				// return the access token straight away
				response = this.token();
			break;
			case "code":
				// create code intead to recieve the access token
				response = this.code(); 
			break;
			default: 
				err = { error : "unsupported_response_type", message: "Authentication failed: The requested response type is not supported by the authorization server." };
			break;
		}
		
		if(err) return err;
		return response;
	}, 

	code : function(){
		var now = new Date();
		
		var code = crypto.createHash('md5').update("" + this.secret + now.getTime() ).digest("hex");
		// expire codes after 5 min
		var expires_in = 300000;
		
		return { code : code, expires_in : expires_in};
	}, 
	
	// generate token by validating the host (domain) and adding the current date (expires in 24 hours: 24x60x60x1000)  
	token : function(){
		var now = new Date();
		
		var access_token = crypto.createHash('md5').update("" + this.secret + now.getTime() ).digest("hex");
		var expires_in = 86400000;
		
		return { access_token : access_token, expires_in : expires_in};
	}, 
	
	redirect : function( response ){
		
		// convert to a URL (if redirecting)
		switch( this.response_type ){
			case "token":
				response = this.redirect_uri +"#access_token="+ response.access_token;
			break;
			case "code":
				response = this.redirect_uri +"?"+ serialize( response );
			break;
			default: 
				err = { error : "unsupported_response_type", message: "Authentication failed: The requested response type is not supported by the authorization server." };
			break;
		}
		
		if(err) return err;
		return response;
	}

	/*
	render: function(res){
		
		res.send( JSON.stringify( res.data ) );
		
	}
	
	*/
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
