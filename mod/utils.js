module.exports = {
	log(res, msg, user_msg){
		msg = msg || 'internal_msg';
		user_msg = user_msg || msg;

		console.log('LOGGING: ' + msg);
		res.json({error: user_msg});
	},
	validate_email(email) {
		var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(String(email).toLowerCase());
	}
};