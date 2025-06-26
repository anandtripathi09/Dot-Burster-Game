import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true },
  mode: { type: Number, required: true }, // 1, 2, or 3
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    taps: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now }
  }],
  status: { 
    type: String, 
    enum: ['waiting', 'countdown', 'playing', 'finished', 'cancelled'],
    default: 'waiting' 
  },
  startTime: Date,
  endTime: Date,
  winner: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    taps: Number
  },
  entryFee: Number,
  totalPool: Number,
  platformFee: Number,
  winnerPrize: Number,
  maxPlayers: Number
}, {
  timestamps: true
});

export default mongoose.model('Game', gameSchema);