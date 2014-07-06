// Defaults
var options = {
	authorize: "bearer", // the way the token is transmitted. Options: bearer, query, all
	routes: true, // limits execution of oauth middleware to specific routes
	auth: {
		"authorize": "/authorize", // path for the authorize form, default: <host>/authorize' (get/post)
		"access_token": "/access_token", // path for the access token url endpoint, default: <host>/access_token
		"refresh_token": "/refresh_token",
		"request_token": "/request_token", // path for the request token url endpoint, default: <host>/request_token
	}, // a list of routes used for authentication
	api: "/api/", // api path (used in conjunction with routes flag)
	host: false, // limits execution of oauth middleware to a specific host
	authority: false, // third-party method to verify credentials
	store: false, // db where tokens are stored
	middleware: true, // flag if lib is used as middleware (or directly)
	model: "memory", // options: memory, redis, custom model
}

module.exports = options;