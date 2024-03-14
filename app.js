// app.js

const express = require('express');
const { queryDatabase } = require('./db');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/query', async (req, res) => {
    const { query } = req.body;
    try {
        const result = await queryDatabase(query);
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
