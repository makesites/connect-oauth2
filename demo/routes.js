
		/*
		// register app 
		server.get( config.action.register , function(req, res){ 
			// validate the request
			result = oauth.register( req.headers['host'] );
			res.send( result );
		});
		*/ 
		
		// reset app key
		/*
		server.get( config.action.reset , function(req, res){ 
			// validate the request
			result = oauth.reset( req.headers['host'] );
			res.send( result );
		});
		*/
		
		// consider decoupling this for every instance of crudr...
		// handle authentication
		server.get( config.oauth +'/:action', function(req, res){ 
			// validate the request
			//...
			var action = req.params.action;
			if( typeof( oauth[action] ) == "undefined") res.end({ error: "method not supported" });
			
			result = oauth[action]( req );
			
			if( !result ) res.end({ error: "oAuth "+ action +" failed" });
			
			// post-actions
			switch( action ){
				case "authorize":
				// condition when to redirect, based on the request_type and redirect_uri 
				//res.redirect( req.query.redirect_uri + '?' + serialize (result ) );
				res.send(result);
				break;
			}
			
			// if nothing matches this far, just end the request
			res.end();
			
		});
		