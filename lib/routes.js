/**
 * OAuth Routes
 * - checks if the request is in the list of accepted routes
**/

var Routes = function( options ){

	options = options || {};

	// class options
	this.options = {
		routes: options.routes,
		host: options.host,
		api: options.api
	}

}

Routes.prototype = {

	constructor: Routes,

	valid: function( req, res ){
		// get host and path (error control?)
		var host = req.host || req._parsedUrl.host || false;
		var path = req.path || req._parsedUrl.pathname || false;

		if( this.options.host ){
			var valid_host = ( this.options.host.indexOf( host ) > -1 );
			// no need to proceed further
			if( !valid_host ) return false;
		}

		if( this.options.routes ){
			// fast-forward if this is the root
			if( path == "/" )  return false;
			// check api first (as it is a more common occurance)
			if( this.options.api ){
				var valid_api = ( this.options.api.indexOf( path ) > -1 );
				// found an api endpoint we're good...
				if( valid_api ) return true;
			}
			// secondly, check the endpoints
			for( var i in this.options.routes ){
				var uri = this.options.routes[i];
				var valid_route = ( uri.indexOf( path ) > -1 );
				// on the first valid endpoint, exit
				if( valid_route ) return true;
			}
			// no valid route found
			return false;
		}
		// all test passed...
		return true;
	},

	// returns the key of the current route
	key: function( req, res ){
		var path = req.path || req._parsedUrl.pathname || false;
		for( var i in this.options.routes ){
			var uri = this.options.routes[i];
			var route = ( uri.indexOf( path ) > -1 );
			// on the first valid endpoint, exit
			if( route ) return i;
		}
	}

}


module.exports = Routes;
