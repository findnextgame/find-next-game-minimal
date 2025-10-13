const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  title: String,
  callTime: Date,
  deadline: Date,
  guaranteedSpots: { type: Number, default: 10 },
  queue: [{
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    optInTime: { type: Date, default: Date.now },
    status: { type: String, enum: ['opted-in', 'paid'], default: 'opted-in' },
    paidForBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null } // For paying for others
  }],
  reserves: [{
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    optInTime: { type: Date, default: Date.now }
  }],
  isFreeForAll: { type: Boolean, default: false }
});

module.exports = mongoose.model('Game', GameSchema);