// this is the basic use of the lib, included as a middleware of the "app"

var oauth2 = require("../index"), // use instead: require("connect-oauth2")
	connect = require('connect'),
	querystring = require('querystring'),
	http = require('http');

var token = null;
var api = "http://localhost";

// APP
var app = connect()
	.use(
		oauth2({
			authority: authority,
			store: "memory"
		})
	)
	.use(function(req, res){
		// simple router
		var path = req._parsedUrl.pathname;

		switch( path ){
			case "/":
				// check login state
				if( token ){
					res.end("You are now logged in! Token: "+ token);
				} else {
					// display login form
					var form = '<html><body><form action="http://localhost:3000/login" method="GET"><p><input name="username" placeholder="any username"></p><p><input name="password" placeholder="any password"></p><input type="submit"></body></html>';
					res.end( form );
				}
			break;
			case "/login":
				var params = querystring.parse( req._parsedUrl.query );
				console.log( "params", params );
				// send request
				var username = params.username;
				var password = params.password;
				var url = api +"/oauth/token?grant_type=password&username="+ username +"&password="+ password +"&client_id=test123&client_secret=mypassword&redirect_uri=http://localhost:3000/auth/token";
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
		}
	});


// Helper

function authority( data, callback ){

	console.log( "authorize data", data );

	for(var key in data){
		// key can be: client_id, client_secret, username, password
		// validate data here...
	}
	return callback(true);

}


http.createServer(app).listen(8080);
