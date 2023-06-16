import * as mysql from 'mysql';

const connection = mysql.createConnection({
	host: 'mydb.c3uqkzjashmi.us-east-1.rds.amazonaws.com',
	port: 3306,
	user: 'admin',
	password: 'ZTBtC}hm6geM39+',
});

connection.connect((err) => {
	if (err) {
		console.error('An error occurred while connecting to the DB');
		throw err;
	}
	console.log('Connected to the DB!');
});

connection.query('SELECT * FROM testdb.recordings', (err, results) => {
	if (err) throw err;
	console.log(results);
});