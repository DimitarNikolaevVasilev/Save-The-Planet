var jwt = require('jsonwebtoken');

module.exports = {
	get_token(req, res, next){
		var token = req.body.token;
		mysql(con => {
			con.query('SELECT COUNT(*) AS `exists` FROM token WHERE token = ?', [token], (err, results) => {
				con.release();
				if(!err && results[0].exists){
					module.exports.verify_token(token).then(decoded => {
						console.log(decoded);
						req.token = decoded;
						next(undefined, req, res);
					}).catch(err => {next();});
				}else next(undefined, req, res);
			});
		});

	},
	validate_token(req, res, next){
		module.exports.get_token(req, res, (err, req, res) => {
			if(req.token)return next();
			res.json({error: 'invalid_login'});
		});
	},
	create_token(id_perfil, expiration){
		return new Promise((resolve, reject) => {
			// 12 days of expiration
			jwt.sign({id: id_perfil, exp: Math.floor(Date.now() / 1000 + (60 * 60 * 24 * 120))}, process.env.jwt_key, { algorithm: 'HS512'}, (err, token) => {
				if(err)return reject(err);
				resolve(token);
			});
		});
	},
	create_save_token(id_perfil, expiration){
		return new Promise((resolve, reject) => {
			module.exports.create_token(id_perfil, expiration).then(token => {
				mysql(con => {
					con.query('INSERT INTO token SET ?', {id_perfil: id_perfil, token: token}, (err, results) => {
						con.release();
						if(err)return reject(err);
						resolve(token);
					});
				});
			}).catch(err => reject);
		});
	},
	verify_token(token){
		return new Promise((resolve, reject) => {
			jwt.verify(token, process.env.jwt_key, {algorithm: 'HS512'}, (err, decoded) => {
				if(err)return reject(err);
				resolve(decoded);
			});
		});
	}
};