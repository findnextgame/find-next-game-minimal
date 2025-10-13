const express = require('express');
const app = express();
app.use(express.json());

const gamesRouter = require('./routes/games');
app.use('/api/games', gamesRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Find Next Game API is running!' });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

app.listen(3000, () => console.log('Server running on port 3000'));

module.exports = app;