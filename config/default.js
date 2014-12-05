// Defaults
var config = {
	authorize: "bearer", // the way the token is transmitted. Options: bearer, query, all
	// setup routes to limit execution of oauth middleware to specific routes
	routes: {
		"authorize": "/oauth/authorize", // path for the authorize form, default: <host>/oauth/authorize' (get/post)
		"token": "/oauth/token", // path for the access token url endpoint, default: <host>/oauth/token
	}, // a list of routes used for authentication
	secret: (new Date()).getTime(), // the secret used for encoding/decoding strings
	api: "/api/", // api path, for authorizing data requests
	host: false, // limits execution of oauth middleware to a specific host
	authority: false, // third-party method to verify credentials
	store: "memory", // options: memory, redis, custom model
	middleware: true, // flag if lib is used as middleware (or directly)
	db: false // db where tokens are stored
}

module.exports = config;
