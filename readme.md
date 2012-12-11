
## Connect OAuth2

Lightweight OAuth2 provider with minimal dependencies, as a connect middleware

## Install

```
npm install connect-oauth2
```

## Usage 

The lib is meant to be used as a middleware of an existing server

```
var oauth2 = require("connect-oauth2"), 
	connect = require('connect'), 
	http = require('http'), 
	MemoryStore = connect.session.MemoryStore;

var app = connect()
  .use( oauth2({ store: new MemoryStore({ reapInterval: 60000 * 10 }) }) )
  .use(function(req, res){
    res.end('Hello from Connect!\n');
  });

http.createServer(app).listen(3000);
```