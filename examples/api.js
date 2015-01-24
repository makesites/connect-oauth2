// this example simulates an API request, after we've recieved a token

var OAuth2 = require("../index"), // use instead: require("connect-oauth2")
	request = require('request'),
	connect = require('connect'),
	http = require('http');

var token = null;
var api = "http://localhost";

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
					var body = '<html><body>';
					body += 'Application Token: '+ token;
					body += '<p><button><a href="/valid">Authorized API request</a></button></p>';
					body += '<p><button><a href="/invalid">Unauthorized API request</a></button></p>';
					body += '</body></html>';
					res.end(body);
				} else {
					// request token
					request.get( api +"/oauth/token?client_id=test123&client_secret=mypassword&grant_type=client_credentials",
					function( error, response, result ){
						var data = JSON.parse( result );
						console.log("data", data);
						token = data.access_token;
						// redirect to "register" token
						res.writeHead(301, {'Location': "http://localhost:8080/" });
						res.end();
					});
				}
			break;
			case "/valid":
				// attach the token to the request headers
				request.get({
					url: api +"/api/data",
					headers: {
						'Authorization': 'Bearer '+ token
					}
				},
				function( error, response, result ){
					console.log("result", result);
					res.end(result);
				});
			break;
			case "/invalid":
				// just request the data
				request.get(api +"/api/data",
				function( error, response, result ){
					console.log("result", result);
					res.end(result);
				});
			break;
			case "/api/data":
				// gather data
				res.end('{ "results": "OK" }');
			break;
			default:
				// what to do here?
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
