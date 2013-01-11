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
	
}

OAuth2.prototype = {
	
	authorize : function ( req, res, next ) {
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
			next(err, false);
			return;
		}
		
		if( !referer ){ 
			err = { error: "unauthorized_client", message : "Authentication failed: The client is not authorized to use the requested response type." };
			next(err, false);
			return;
		}
		
		// send preliminary response back (and expect the database data back)
		next(null, function( data, done ){
			
			if ( !data ){
				err = { error: "invalid_client", message : "Authentication failed: The client identifier provided is invalid." };
				done( err );
			}
			
			// if more than one (error control?) pick the first one
			var store = ( data instanceof Array )? data.shift() : data;
			
			// check if there's a client secret
			if( client_secret ){
				
				// authenticate based on the secret provided
				bcrypt.compare(client_id, client_secret, function(err, res) {
					var response;
					if( res == false ) response = { error: "access_denied", message : "Authentication failed: The end-user or authorization server denied the request." };
					response = createResponse({ redirect_uri : redirect_uri,  store : store });
					return done( response );
				});
				
				
			} else {
				// authenticate based on the referrer domain
				console.log( app.domains ); 
				var valid = checkDomains( referer, app.domains);
				
				if( !valid ){ 
					err = { error: "access_denied", message : "Authentication failed: The end-user or authorization server denied the request." };
					return;
				}
				
				response = createResponse({ redirect_uri : redirect_uri,  store : store });
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
	
	// check valid redirect
	if( options.redirect_uri ){ 
		var valid = validRedirect( options.redirect_uri, options.store.redirect_uri );
		if( !valid ){ 
			err = { error: "redirect_uri_mismatch", message : "Authentication failed: The redirection URI provided does not match a pre-registered value." };
		} 
	} else {
		// if requesting token 
	}
	
	//
	switch(response_type){
		case "token":
			// return the access token straight away
			console.log("creating token"); 
		break;
		case "code":
			// create code intead to recieve the access token
			console.log("creating code"); 
		break;
		default: 
			err = { error : "unsupported_response_type", message: "Authentication failed: The requested response type is not supported by the authorization server." };
			
		break;
	}
	
	
	
}

// generate token by validating the host (domain) and adding the current date (accurate to the month = token resets every month)  
function createToken( secret ){
	var now = new Date();
	
	var access_token = crypto.createHash('md5').update("" +  secret + now.getTime() ).digest("hex");
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

function validRedirect( request, store ) {
	// this can be better
	return (strpos(request, store) != false);
}

function checkDomains( domain, domains ) {
	//clean up domain first
	//return (strpos(domain, domains) != false);
}


function isValid( key, host ) {
	var salt = "";
	var secret = crypto.createHash('md5').update("" + key + host + salt ).digest("hex");
	
	return ( secret ==  "oldsecret" );
}



// Helpers
function strpos (haystack, needle, offset) {
  var i = (haystack+'').indexOf(needle, (offset || 0));
  return i === -1 ? false : i;
}


module.exports = lib;
