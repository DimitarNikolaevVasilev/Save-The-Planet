var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit: 20,
	host: 'localhost',
	port: '3306',
	user: process.env.mysql_user,
	password: process.env.mysql_password,
	database: process.env.mysql_database,
	multipleStatements: true
});


module.exports = function(callback){
	pool.getConnection((err, connection) => {
		if(err)return console.log(err);
		callback(connection);
	});
};