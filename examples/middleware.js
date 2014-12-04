// this is the basic use of the lib, included as a middleware of the "app"

var OAuth2 = require("../index"), // use instead: require("connect-oauth2")
	connect = require('connect'),
	querystring = require('querystring'),
	http = require('http'),
	UserAuth = require('./user-auth');

var token = null,
	options = {
		api: "http://localhost:3000",
		app: {
			client_id : 'test123',
			client_secret : 'mypassword'
		}
	};
// helper
var my = new UserAuth( options );

// APP
var app = connect()
	.use(
		OAuth2({
			authority: authority,
			store: "memory"
		})
	)
	.use(function(req, res){
		// simple router
		var path = req._parsedUrl.pathname;

		switch( path ){
			// CLIENT
			case "/":
				// check login state
				if( token ){
					res.end("You are now logged in! Token: "+ token);
				} else {
					// display login button
					res.end( my.login() );
				}
			break;
			case "/auth/code":
				var params = querystring.parse( req._parsedUrl.query );
				console.log( "params", params );
				// stop if we have an error
				if( params.error) return res.end( params.error );
				// exchange the code for and access code
				var url = my.token( params.code );
				res.writeHead(307, {'Location': url });
				res.end();
			break;
			case "/auth/token":
				var params = querystring.parse( req._parsedUrl.query );
				console.log( "params", params );
				// save token and redirect back to the homepage
				token = params.access_token;
				var url = "/";
				res.writeHead(307, {'Location': url });
				res.end();
			break;
			// REMOTE
			case "/oauth/authorize":
				// present the dialog
				console.log("check session...");
				// use template engine for this...
				var form = my.dialog( req );

				res.end( form );
			break;

		// pass through and let the application deal with this

		}
	});

http.createServer(app).listen(3000);



// Helper

function authority( data, callback ){

	console.log( "authorize data", data );

	for(var key in data){
		// key can be: client_id, client_secret, username, password
		// validate data here...
	}
	return callback(true);

}