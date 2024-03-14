// db.js

const mysql = require('mysql2/promise');
const { createSshTunnel } = require('./sshTunnel');

async function getConnection() {
    const tunnel = await createSshTunnel();
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: 3306, // Local port forwarded through the SSH tunnel
        stream: tunnel
    });
    return connection;
}

async function queryDatabase(query) {
    const connection = await getConnection();
    const [rows] = await connection.query(query);
    connection.end();
    return rows;
}

module.exports = {
    queryDatabase
};
