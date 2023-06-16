"use strict";
exports.__esModule = true;
var mysql = require("mysql");
var connection = mysql.createConnection({
    host: 'mydb.c3uqkzjashmi.us-east-1.rds.amazonaws.com',
    port: 3306,
    user: 'admin',
    password: 'ZTBtC}hm6geM39+'
});
connection.connect(function (err) {
    if (err) {
        console.error('An error occurred while connecting to the DB');
        throw err;
    }
    console.log('Connected to the DB!');
});
connection.query('SELECT * FROM testdb.recordings', function (err, results) {
    if (err)
        throw err;
    console.log(results);
});
