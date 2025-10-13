const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Player = require('../models/Player');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Inline auth function
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    const player = await Player.findById(decoded.id);
    req.user = player;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// POST /api/games/create-dummy (Public for testing)
router.post('/create-dummy', async (req, res) => {
  try {
    const game = new Game({
      title: 'Test Game - Sat 7AM Sunningdale',
      callTime: new Date('2025-10-06T12:00:00Z'), // Mon 12:00 SAST
      deadline: new Date('2025-10-09T21:00:00Z') // Thu 9PM SAST
    });
    await game.save();
    res.json({ message: 'Dummy game created', id: game._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create dummy game', details: error.message });
  }
});

// POST /api/games/:gameId/opt-in (Public opt-in)
router.post('/:gameId/opt-in', async (req, res) => {
  try {
    const { gameId, email } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const player = await Player.findOne({ email: email.toLowerCase() });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    if (game.queue.length < game.guaranteedSpots) {
      game.queue.push({ playerId: player._id });
    } else {
      game.reserves.push({ playerId: player._id });
    }
    await game.save();

    res.json({ message: 'Opt-in successful!', spot: game.queue.length <= game.guaranteedSpots ? 'Guaranteed' : 'Reserve', queuePosition: game.queue.length });
  } catch (error) {
    res.status(500).json({ error: 'Opt-in failed', details: error.message });
  }
});

// GET /api/games/:gameId/status (Auth required)
router.get('/:gameId/status', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)
      .populate('queue.playerId', 'name surname supportEmoji phone email')
      .populate('reserves.playerId', 'name surname supportEmoji');
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const player = await Player.findById(req.user.id);
    const queueIndex = game.queue.findIndex(q => q.playerId.toString() === player._id.toString());
    const reserveIndex = game.reserves.findIndex(r => r.playerId.toString() === player._id.toString());
    const position = queueIndex !== -1 ? queueIndex + 1 : reserveIndex !== -1 ? game.guaranteedSpots + reserveIndex + 1 : null;
    const deadlineWarning = new Date(game.deadline - 2 * 60 * 60 * 1000) <= new Date() && new Date() <= game.deadline;

    res.json({
      title: game.title,
      position: position ? position : 'Not opted-in',
      status: queueIndex !== -1 ? 'Queue' : reserveIndex !== -1 ? 'Reserve' : 'Not opted-in',
      deadline: game.deadline,
      warning: deadlineWarning ? 'Payment due in 2 hours!' : '',
      queue: game.queue.map(q => ({
        name: q.playerId.name,
        surname: q.playerId.surname,
        emoji: q.playerId.supportEmoji,
        paid: q.status === 'paid'
      })),
      reserves: game.reserves.map(r => ({
        name: r.playerId.name,
        surname: r.playerId.surname,
        emoji: r.playerId.supportEmoji
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Status check failed', details: error.message });
  }
});

// Cron jobs (simplified for minimal)
cron.schedule('0 19 * * 4,0', async () => { // Thu/Sun 7PM SAST
  console.log('Cron: 2-hour reminder triggered');
}, { timezone: 'Africa/Johannesburg' });

cron.schedule('0 21 * * 4,0', async () => { // Thu/Sun 9PM SAST
  console.log('Cron: Free for All triggered');
}, { timezone: 'Africa/Johannesburg' });

module.exports = router;