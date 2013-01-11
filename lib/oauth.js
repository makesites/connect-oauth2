var fs = require("fs"), 
	path = require("path"),
	//nconf = require("nconf"), 
	crypto = require('crypto');
	//access = path.normalize( __dirname + '/../access/'), 
	//config = require('../config/default');
	
	
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
		
		console.log(referer);
		console.log(host);
		
		// clear all cases that are erroneous before even going to the db
		if( !client_id || !redirect_uri ){
			err = { error: "invalid_request", message : "Authentication failed: The request is missing a required parameter, includes an unsupported parameter or parameter value, or is otherwise malformed." };	
			next(err, false);
			return;
		}
		
		if( !client_id || !redirect_uri ){
			err = { error: "invalid_request", message : "Authentication failed: The request is missing a required parameter, includes an unsupported parameter or parameter value, or is otherwise malformed." };
			next(err, false);
			return;
		}
		
		if( !referer ){ 
			err = { error: "unauthorized_client", message : "Authentication failed: The client is not authorized to use the requested response type." };
			next(err, false);
			return;
		}
		
		next(null, function( data ){
			
			if ( !data ){
				err = { error: "invalid_client", message : "Authentication failed: The client identifier provided is invalid." };
				//next(err, false);
			}
			
			// if more than one (error control?) pick the first one
			var app = ( data instanceof Array )? data.shift() : data;
			//console.log( req.query );
			
			// check if there's a client secret
			if( client_secret ){
				// authenticate based on the secret provided
				console.log("providing a secret");
				
				err = { error: "access_denied", message : "Authentication failed: The end-user or authorization server denied the request." };
				//next(err, false);
				
         		// check valid redirect
				console.log( redirect_uri );
				if( redirect_uri ){ 
					err = { error: "redirect_uri_mismatch", message : "Authentication failed: The redirection URI provided does not match a pre-registered value." };
					
				} else {
					redirect_uri = app.redirect_uri;
				}
				
			} else {
				// authenticate based on the referrer domain
				console.log( app.domains ); 
				
				err = { error: "access_denied", message : "Authentication failed: The end-user or authorization server denied the request." };
				
			}
			
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
			
			
		});
		
		/*
		//var host = req.header('Referer');
		//var host = req.headers['host'];
		var key = req.query.client_id;
		var url = req.query.redirect_uri;
		
		loadCreds( key );
		
		var host = req.headers.host;
		
		// check if the request uri is in the same domain as the domain on file
		if( !isValid(key, host) || !validRedirect( url, host ) ) {
			return false;
		}
		
		
		// either way create the token 
		var secret = "";
		
		var token = createToken( secret );
		
		return token;
		*/
	},
	
	access_token : function(){
	
	},

	refresh_token : function(){
	
	},

	register : function ( host ) {
		
		// check to see if the key is initialized
		//if( typeof( nconf.get("key") ) == "undefined" ||  typeof( nconf.get("secret") ) == "undefined" ){
		var creds = createKeyPair( host );
		//}
		
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



// generate token by validating the host (domain) and adding the current date (accurate to the month = token resets every month)  
function createToken( secret ){
	var now = new Date();
	
	var access_token = crypto.createHash('md5').update("" +  secret + (new Date(now.getFullYear(), now.getMonth()) ).getTime() ).digest("hex");
	var expires_in = (new Date(now.getFullYear(), now.getMonth()+1) ).getTime() - now;
	
	/* {
  "error": {
    "type": "OAuthException",
    "message": "Error validating access token."
  } 
}*/
	return { access_token : access_token, expires_in : expires_in};
}

/*
function loadCreds( key ){
	//nconf.file({ file: access+"default.json" });
	//nconf.use('file', { file: access+key+".json" });
	//nconf.load();
	
	// check to see if the key is initialized
	if( typeof( nconf.get("key") ) == "undefined" ||  typeof( nconf.get("secret") ) == "undefined" ){
		//createKeyPair( host );
	}
	
}
*/

function createKeyPair( host ){
	// create the key (unique) based on the date
	var key = crypto.createHash('md5').update("" + (new Date()).getTime()).digest("hex");
	// set the config file (create if necessary)
	//nconf.use('file', { file: access+key+".json" });
	//nconf.load();
	//nconf.set("key", key);
	// create a random generator 
	var generator = Math.floor( Math.random()*1000000 );
	//nconf.set("generator", generator);
	// create the secret base on the key + host
	var secret = crypto.createHash('md5').update("" + key + host + generator ).digest("hex");
	//nconf.set("secret", secret);
	//nconf.set("host", host);
	//nconf.save();
}

function validRedirect( url, host ) {
	return (strpos(url, host) != false);
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
