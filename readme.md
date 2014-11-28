
## Connect OAuth2

Lightweight OAuth2 provider with minimal dependencies, as a connect middleware.

Major goal for the lib is to create a clean and straightforward implementation of the [latest official spec](http://tools.ietf.org/html/rfc6749).

For storing the tokens the lib can use a Memory or Redis store, or any other store if supplied a proper inteface model.


## Install

```
npm install connect-oauth2
```

## Usage

The lib is meant to be used with a Connect or Express ```app```. It can be loaded either as a middleware or triggered manually on selected routes.

```
var oauth2 = require("connect-oauth2"),
	connect = require('connect'),
	http = require('http');

var app = connect()
	.use(
		oauth2({
			authority: authority,
			store: "memory"
		})
	);

http.createServer(app).listen(3000);
```

Look into the [examples](./examples) folder for more sample code.

### Routes

OAuth2 operates either with separate endpoint URLs, or the ```grant_type``` parameter in the query to specify different actions.


Comparing grant types to most common URLs:

* client_credentials => /request_token
* authorization_code => /access_token
* refresh_token => refresh_token
* password => /authorize

In additon some endpoints have no grant types:

* /authorize ( response_type == "code" )


The option ```routes``` is enabled by default as a security measure, so the lib will skip processing credentials unless pinged from certain endpoints.


### Authority

Part of the main options of the lib is passing a custom method under the ```authority``` key. This method will be triggered every time credentials need to be verified. It is assumed that it will be part of your _app_ and connected to the necessary modules that will make this verification possible.

An example of the basic scaffolding follows:
```
function( data, callback ){

	for(var key in data){
		// key can be: client_id, client_secret, username, password
		// validate data here...
		// if not correct:
		return callback(false);
	}
	return callback(true);
}
```


## Options


* **authority** (function, default: null), a method that tests the credentials provided and returns a boolean (true/false)
* **routes** (boolean, default: true), limits execution of the OAuth directives to specific routes
* **store** (string, default: "memory"), defines the type of store used for storing the tokens. Currently supported: redis, memory
* **db** (object, default: false), a reserved key if passing a redis db instance (used only if "store" is set other than the default) 


## Credits

Initiated by Makis Tracend ( [@tracend](http://github.com/tracend) )

Distributed through [Makesites](http://makesites.org)


## License 

Released under the [Apache license, version 2.0](http://makesites.org/licenses/APACHE-2.0)
