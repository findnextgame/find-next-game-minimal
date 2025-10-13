const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: String,
  surname: String,
  phone: String, // For WhatsApp
  email: String,
  supportEmoji: String, // e.g., 🇫🇷 for France
  isLastReserve: { type: Boolean, default: false },
  penaltyExpiry: Date,
  shouldBeLastReserve: { type: Boolean, default: false }, // Manual flag
  strikes: { type: Number, default: 0 } // For 3-strike ban
});

module.exports = mongoose.model('Player', PlayerSchema);