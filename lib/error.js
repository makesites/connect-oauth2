/**
 * OAuth2 Error
 * - catch OAuth errors and ensure an OAuth complaint response
**/


var errors = {

	"invalid_request": {
		error: "invalid_request",
		message : "Authentication failed: The request is missing a required parameter, includes an unsupported parameter or parameter value, or is otherwise malformed."
	},

	"unauthorized_client": {
		code: 401,
		error: "unauthorized_client",
		message : "Authentication failed: The client is not authorized to use the requested response type."
	},

	"invalid_client": {
		code: 400,
		error: "invalid_client",
		message : "Authentication failed: The client identifier provided is invalid."
	},

	"missing_parameter": {
		code: 400,
		error: "missing_parameter",
		message : "Missing required parameter: "
	},

	"invalid_access_token": {
		code: 400,
		error: "invalid_access_token",
		message : "Authentication failed: The access token provided is invalid."
	},

	"expired_access_token": {
		code: 400,
		error: "expired_access_token",
		message : "Authentication failed: The access token provided has expired."
	},

	"invalid_refresh_token": {
		code: 400,
		error: "invalid_access_token",
		message : "Authentication failed: The refresh token provided is invalid."
	},

	"expired_refresh_token": {
		code: 400,
		error: "expired_access_token",
		message : "Authentication failed: The refresh token provided has expired."
	},

	"redirect_uri_mismatch": {
		code: 400,
		error: "redirect_uri_mismatch",
		message : "Authentication failed: The redirection URI provided does not match a pre-registered value."
	},

	"access_denied": {
		code: 400,
		error: "access_denied",
		message : "Authentication failed: The end-user or authorization server denied the request."
	},

	"unsupported_response_type": {
		code: 400,
		error : "unsupported_response_type",
		message: "Authentication failed: The requested response type is not supported by the authorization server."
	},

	"unknown_error": {
		code: 500,
		error : "unknown_server_error",
		message: "An error occured in your request. Please try again later."
	}
};


// Consider additional erros:
// - Only one method may be used to authenticate at a time
// - Method cannot be GET When putting the token in the body
// - When putting the token in the body, content type must be application/x-www-form-urlencoded
// References:
// Header: http://tools.ietf.org/html/rfc6750#section-2.1
// POST: http://tools.ietf.org/html/rfc6750#section-2.2


module.exports = function( label, msg ){
	var self = this;

	// find error in the list
	var error = errors[label];
	// fallback to default
	if( !error ) error = errors["unknown_error"];
	// append custome message
	if( msg ) error.message += msg;
	// display console log (make this optional?)
	new Error( error.message );
	// self.debug( error );

	//
	return error;
}
