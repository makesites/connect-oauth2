
## Connect OAuth2

Lightweight OAuth2 provider with minimal dependencies, as a connect middleware.

Major goal for the lib is to create a clean and straightforward implementation of the [latest official spec](http://tools.ietf.org/html/rfc6749).

For storing the tokens the lib can use a Memory or Redis store, or any other store if supplied a proper inteface model.


## Install

```
npm install connect-oauth2
```

## Usage

The lib is meant to be used with a Connect or Express ```app```.

It can be loaded either as a middleware:

```
var OAuth2 = require("connect-oauth2"),
	connect = require('connect'),
	http = require('http');

var app = connect()
	.use(
		OAuth2({
			authority: authority,
			store: "memory"
		})
	);

http.createServer(app).listen(80);
```

Or triggered manually on selected routes:

```
var OAuth2 = require("connect-oauth2"),
	connect = require('connect'),
	http = require('http');

// init OAuth provider
var oauth = OAuth2({
	authority: authority,
	routes: options.routes,
	middleware: false,
	store: "memory"
});

// APP
var app = connect()
	.use(function(req, res, next){
		// simple router
		var path = req._parsedUrl.pathname;

		switch( path ){

			// OAuth methods
			case "/authorize":
				oauth.userAuth(req, res, next);
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

http.createServer(app).listen(80);
```

Look into the [examples](./examples) folder for more sample code.


### Authentication methods

Following the official spec, you can use the lib to authenticate in any of the following ways. Note that all tokens expire in a day but deleted from the database in 60 days if a refresh token is available.


#### Application Auth

Request a token for the application itself, without a user context.

Endpoint
```
/oauth/token
```

Parameters
```
grant_type: client_credentials
client_id
client_secret
scope (optional)
```

No refresh token is included with this type of authentication.


#### User Auth - Code Grant

This is the most common user authentication and it’s performed in two subsequent requests.

1. Ask for permission:

Endpoint
```
/oauth/authorize
```

Parameters
```
response_type=code
client_id
redirect_uri
scope (optional)
```

2. Receive a code an exchange it for an access token

Endpoint
```
/oauth/token
```

Parameters
```
grant_type=authorization_code
code
redirect_uri
```

#### User Auth - Implicit Grant

This is a client-side authentication that doesn't share the _secret_; instead it relies on a registered redirect url.

Endpoint
```
/oauth/authorize
```

Parameters
```
response_type=token
client_id
redirect_uri
scope (optionsal)
```

Returns the access token as a hash in the ```redirect_uri``` URL

No refresh token is included with this type of authentication.


#### User Auth - Password

In this method the user shares their username/password with the application. Please be advised that in some cases this practice could be a security risk.

Endpoint
```
/oauth/token
```

Parameters
```
grant_type=password
username
password
client_id
client_secret
```


#### Refresh token

If a ```refresh_token``` is provided you can use it to renew an access_token, once expired:

Endpoint
```
/oauth/token
```

Parameters
```
grant_type=refresh_token
refresh_token
client_id
client_secret
```


### Routes

Legacy OAuth2 operated either with separate endpoint URLs, or the ```grant_type``` parameter in the query to specify different actions.

Comparing grant types to most common URLs:

* client_credentials => /request_token
* authorization_code => /access_token
* refresh_token => refresh_token

Although not according to spec, it is left as an option in case the application developer wuld prefer to use different endpoints for every action.

The option ```routes``` is enabled by default as a security measure, so the lib will skip processing credentials unless pinged from certain endpoints.


### Authority

Part of the main options of the lib is passing a custom method under the ```authority``` key. This method will be triggered every time credentials need to be verified. It is assumed that it will be part of your _app_ and connected to the necessary modules that will make this verification possible.

An example of the basic scaffolding follows:
```
function( data, callback ){

	for(var key in data){
		// key can be: client_id, client_secret, username, password, user_id, redirect_uri
		// validate data here...
		// if not correct:
		return callback(false);
	}
	return callback(true);
}
```


## Options


* **authority** (function, default: null), a method that tests the credentials provided and returns a boolean (true/false)
* **routes** (object, defaults to sample routes), define auth endpoints to limit execution of the OAuth directives to specific routes
* **api** (object, default: "/api/"), authorize api requests set with a prefix path
* **store** (string, default: "memory"), defines the type of store used for storing the tokens. Currently supported: redis, memory
* **db** (object, default: false), a reserved key if passing a redis db instance (used only if "store" is set other than the default)


## Credits

Initiated by Makis Tracend ( [@tracend](http://github.com/tracend) )

Distributed through [Makesites](http://makesites.org)


## License

Released under the [Apache license, version 2.0](http://makesites.org/licenses/APACHE-2.0)
