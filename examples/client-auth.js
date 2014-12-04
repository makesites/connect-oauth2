// similar to user-auth using middleware, only now the credentials are passed on the client-side (using a hash)

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
					res.end( my.login("token") );
				}
			break;
			case "/auth/token":
				// credentials passed to the client using a hash
				res.end("<script>alert( window.location.hash )</script>");
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