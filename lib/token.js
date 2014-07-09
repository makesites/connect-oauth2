/**
 * OAuth2 Token
 * - token generator
 *
 * Methods:
 * create(): returns a new token
 * code(): returns a temporary code
**/

var crypto = require('crypto');

var Token = function( options ){
	// fallbacks
	options = options || {};

}

Token.prototype = {

	constructor: Token,

	// generate token by validating the host (domain) and adding the current date (expires in 24 hours: 24x60x60x1000)
	create: function( code ){
		var now = new Date();

		/* async method with random bytes
		crypto.randomBytes(256, function (ex, buffer) {
			if (ex) return callback(error('server_error'));

			var token = crypto
				.createHash('sha1')
				.update(buffer)
				.digest('hex');

			callback(false, token);
		});
		*/

		//case 'HMAC-SHA1':
		//return crypto.createHmac('sha1', key).update(baseString).digest('base64');

		// using the code to render the access token
		var access_token = crypto.createHash('md5').update("" + code + now.getTime() ).digest("hex");
		var refresh_token = crypto.createHash('md5').update( access_token ).digest("hex");
		// expire tokens in a day
		var expires_in = 86400000; // (1000 * 60 * 60 * 24)

		return { access_token: access_token, refresh_token: refresh_token, expires_in: expires_in };
	},

	// creating a simple 24 char code
	code : function(){

		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
		var code = '';
		var length = 24;

		for(var i = 0; i < length; ++i){
			code += chars[Math.floor(Math.random() * chars.length)];
		}

		// expire codes after 5 min
		var expires_in = 300000;

		return { code: code, expires_in: expires_in };
	},


}


module.exports = Token;
