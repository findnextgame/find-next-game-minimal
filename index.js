const express = require('express');
const app = express();
app.use(express.json());

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/testdb');

app.get('/', (req, res) => {
  res.json({ message: 'Find Next Game API is running!' });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

app.listen(3000, () => console.log('Server running on port 3000'));

module.exports = app;