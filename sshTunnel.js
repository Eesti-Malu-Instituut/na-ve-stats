// sshTunnel.js

const { Client } = require('ssh2');
require('dotenv').config();

async function createSshTunnel() {
    return new Promise((resolve, reject) => {
        const conn = new Client();

        conn.on('ready', () => {
            conn.forwardOut(
                '127.0.0.1',
                process.env.SSH_LOCAL_PORT,
                process.env.DB_HOST,
                process.env.DB_PORT,
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
            privateKey: require('fs').readFileSync(process.env.SSH_KEY),
            readyTimeout: 30000
        });
    });
}

module.exports = {
    createSshTunnel
};
