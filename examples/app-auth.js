// this is the basic use of the lib, included as a middleware of the "app"

var OAuth2 = require("../index"), // use instead: require("connect-oauth2")
	request = require('request'),
	connect = require('connect'),
	http = require('http');

var token = null;


// APP
var app = connect()
	.use(
		// init as a middleware
		OAuth2({
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
					res.end("Application Token: "+ token);
				} else {
					// request token
					request.get("http://localhost:3000/oauth/token?client_id=test123&client_secret=mypassword&grant_type=client_credentials",
					function( error, response, result ){
						var data = JSON.parse( result );
						console.log("data", data);
						token = data.access_token;
						// redirect to "register" token
						res.writeHead(301, {'Location': "http://localhost:3000/" });
						res.end();
					});
				}
			break;
			default:
				// what to do here?
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