// in this example we see the oauth lib initiated independently (not as a middleware) and executed on demand

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
		},
		// custom routes
		routes: {
			authorize: "/authorize",
			access_token: "/access_token",
			refresh_token: "/refresh_token",
			request_token: "/request_token"
		}
	};

// init OAuth provider
var oauth = OAuth2({
	authority: authority,
	routes: options.routes,
	middleware: false,
	store: "memory"
});

// helper
var my = new UserAuth( options );

// APP
var app = connect()
	.use(function(req, res, next){
		// simple router
		var path = req._parsedUrl.pathname;

		switch( path ){
			// Client methods
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

			// OAuth methods
			case "/authorize":
				oauth.userAuth(req, res, function(){
					// present the dialog
					console.log("check session...");
					// use template engine for this...
					var form = my.dialog( req );
					res.end( form );
					next();
				});

			break;
			case "/access_token":
				oauth.accessToken(req, res, next);
			break;
			case "/refresh_token":
				oauth.refreshToken(req, res, next);
			break;
			case "/request_token":
				oauth.requestToken(req, res, next);
			break;
		}
	});


// Helper

function authority( data, callback ){

	console.log( "authorize data", data );

	for(var key in data){
		// key can be: client_id, client_secret, username, password, uid
		// validate data here...
	}
	return callback(true);

}


http.createServer(app).listen(3000);
