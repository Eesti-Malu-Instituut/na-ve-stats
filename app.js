const express = require('express');
const mysql = require('mysql2/promise');
const { Client } = require('ssh2');
require('dotenv').config();
const PK = require('fs').readFileSync(process.env.SSH_KEY);

async function createSshTunnel() {
    return new Promise((resolve, reject) => {
        const conn = new Client();

        console.log('Creating SSH tunnel:')
        console.log(`> ssh -L ${process.env.SSH_LOCAL_PORT}:${process.env.DB_HOST}:${process.env.DB_PORT} ${process.env.SSH_USER}@${process.env.SSH_HOST} -i "${process.env.SSH_KEY}"`);

        conn.on('ready', () => {
            conn.forwardOut(
                '127.0.0.1',
                process.env.SSH_LOCAL_PORT, // local port
                '127.0.0.1',
                process.env.DB_PORT, // remote port
                (err, stream) => {
                    if (err) {
                        conn.end();
                        reject(err);
                        return;
                    }

                    resolve(stream);
                }
            );
        });

        conn.on('error', (err) => {
            console.error('SSH error:', err);
            reject(err);
        });

        conn.connect({
            host: process.env.SSH_HOST,
            port: 22,
            username: process.env.SSH_USER,
            privateKey: PK,
            readyTimeout: 30000
        });
    });
}

const app = express();
const port = 3000;

async function getDatabaseData(req, res, next) {
    try {
        console.log('wait for tunnel and connection...');
        const tunnel = await createSshTunnel();
        console.log('tunnel created');
        console.log('connecting to database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.SSH_LOCAL_PORT,
            stream: tunnel
        });

        const [rows] = await connection.query('SELECT * FROM allikad');
        connection.end();
        tunnel.end();

        res.json(rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
}

app.get('/', getDatabaseData);


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
