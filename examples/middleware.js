// this is the basic use of the lib, included as a middleware of the "app"

var oauth2 = require("../index"), // use instead: require("connect-oauth2")
	connect = require('connect'),
	querystring = require('querystring'),
	http = require('http');

var token = null;

// APP
var app = connect()
	.use(
		oauth2({
			authority: authority,
			model: "memory"
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
					// display login button
					res.end("<html><body><button><a href='http://localhost:3000/authorize?client_id=test123&response_type=code&redirect_uri=http://localhost:3000/auth/code'>Click to login</a></button></body></html>");
				}
			break;
			case "/auth/code":
				var params = querystring.parse( req._parsedUrl.query );
				console.log( "params", params );
				// exchange the code for and access code
				var url = "http://localhost:3000/access_token?code="+ params.code +"&client_id=test123&client_secret=mypassword&redirect_uri=http://localhost:3000/auth/token";
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