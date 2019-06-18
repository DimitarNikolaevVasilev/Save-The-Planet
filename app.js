console.log("Loading...");

require('./mod/check_env')();

global.app = require('./mod/server');
global.mysql = require('./mod/mysql');
global.sec = require('./mod/sec');
global.utils = require('./mod/utils');


app.post('/guardar_perfil', sec.get_token, (req, res) => {
	var body = req.body;
	mysql(con => {
		if(req.token){
			var data = {
				nombre: body.nombre,
				foto: body.foto,
				fingerprint: body.fingerprint
			};
			if(body.contrasena)data.contrasena = body.contrasena;
			con.query('UPDATE perfil INNER JOIN token ON perfil.id = token.id_perfil SET ? WHERE token.token = ?', [data, body.token], (err, results) => {
				if(err)return console.log(err);
				con.release();
				res.json({token: body.token});
			});
		}else if(!body.token){
			console.log(body);
			if(!utils.validate_email(body.email) || !(typeof body.contrasena == 'string' && body.contrasena.length > 2))return res.json({error: 'invalid_data'});
			con.query('SELECT COUNT(*) AS "exists" FROM perfil WHERE email=?', [body.email], (err, results) => {
				console.log(results);
				if(err)return utils.log(res, err, 'internal_error');
				if(results[0].exists)return res.json({error: 'email_exists'});
				con.query('INSERT INTO perfil SET ?', {
					nombre: body.nombre,
					foto: body.foto,
					contrasena: body.contrasena,
					fingerprint: body.fingerprint,
					email: body.email,
					fecha_registro: new Date()
				}, (err, results) => {
					if(err)return utils.log(res, err, 'internal_error');
					if(!results.insertId)return utils.log(res);
					con.release();

					sec.create_save_token(results.insertId).then(token => {
						res.json({token: token});
					}).catch(err => {
						utils.log(res, err, 'internal_error');
					})

					console.log('INSERT ID: ', results.insertId);
				});
			});
		}else{
			res.json({error: 'invalid_login'});
		}
	});
});
app.post('/status', (req, res) => {
	res.json({data: 'OK'});
});


app.post('/devolver_perfil', sec.validate_token, (req, res) => {
	mysql(con => {
		con.query('SELECT nombre, email, foto FROM perfil WHERE id=?', [req.token.id], (err, results) => {
			if(err)return utils.log(res, err, 'internal_error');
			if(results.length){
				var r = results[0];
				res.json({
					nombre: r.nombre,
					email: r.email,
					foto: r.foto
				});
			}else{
				res.json({error: 'invalid_login'});
			}
		});
	});
});

app.post('/login', (req, res) => {
	var body = req.body;
	console.log(body);
	mysql(con => {
		con.query('SELECT id FROM perfil WHERE email=? AND contrasena=?', [body.email, body.contrasena], (err, results) => {
			if(err)return console.log(err);
			var id = (!results.length ? false : results[0].id);
			con.release();
			if(!id)return res.json({error: 'invalid_data'});
			sec.create_save_token(id).then(token => {
				res.json({token: token});
			}).catch(err => {
				res.json({error: 'internal_error'});
			});
		});
	});
});


app.post('/donar_new_arbol', (req, res) => {
	var body = req.body;
	console.log(body);
	var textura = {
		color_hojas1: body.color_hojas1,
		color_hojas2: body.color_hojas2,
		color_tronco: body.color_tronco,
	};

	mysql(con => {
		con.query('SELECT perfil.id FROM perfil INNER JOIN token ON perfil.id = token.id_perfil WHERE token.token = ?', [body.token], (err, results) => {
			console.log(err, results);
			var id;
			if(results.length)id = results[0].id;
			else id = -1;
			con.query('INSERT INTO arbol SET ?', {
				id_creador: id,
				modelo: body.modelo,
				fecha_plantacion: new Date(),
				nivel: body.size,
				posicion: JSON.stringify(body.posicion),
				textura: JSON.stringify(textura),
				posicion_normal: JSON.stringify(body.normal_posicion)
			}, (err, results) => {
				console.log(err, results);
				if(!err)return res.json({data: 'OK'});
				res.json({error: 'internal_error'});
			});
			con.release();
		});
	});
});

app.post('/devolver_arboles', (req, res) => {
	mysql(con => {
		con.query('SELECT * FROM arbol', (err, results) => {
			var arboles = [];
			for(let i = 0;i<results.length;i++){
				var r = results[i];
				var textura = JSON.parse(r.textura);
				arboles.push({
					id_creador: r.id_creador,
					modelo: r.modelo,
					size: r.nivel,
					posicion: JSON.parse(r.posicion),
					color_tronco: textura.color_tronco,
					color_hojas2: textura.color_hojas2,
					color_hojas1: textura.color_hojas1,
					normal_posicion: JSON.parse(r.posicion_normal)
				});
			}
			res.json({'arboles': arboles});
			con.release();
		});
	});
});


app.listen(process.env.port, () => {
	console.log("Server is listening on port ", process.env.port);
});