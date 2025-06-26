import express from 'express';
import Game from '../models/Game.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get active games (limited to 3)
router.get('/active', protect, async (req, res) => {
  try {
    const games = await Game.find({ 
      status: { $in: ['waiting', 'countdown', 'playing'] } 
    })
    .populate('players.userId', 'name')
    .sort({ createdAt: -1 })
    .limit(3); // Limit to 3 active games
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's game history
router.get('/history', protect, async (req, res) => {
  try {
    const games = await Game.find({ 
      'players.userId': req.user.id,
      status: 'finished'
    }).sort({ createdAt: -1 }).limit(10);
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recent winners for dashboard
router.get('/recent-winners', protect, async (req, res) => {
  try {
    const recentGames = await Game.find({ 
      status: 'finished',
      winner: { $exists: true }
    })
    .populate('winner.userId', 'name')
    .sort({ endTime: -1 })
    .limit(10);
    
    const winners = recentGames.map(game => ({
      userName: game.winner.name,
      mode: game.mode,
      prize: game.winnerPrize,
      taps: game.winner.taps,
      endTime: game.endTime
    }));
    
    res.json(winners);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Play demo game
router.post('/demo', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.demoPlayed) {
      return res.status(400).json({ message: 'Demo already played' });
    }

    // Credit demo amount (will be removed after demo play)
    user.walletBalance += 100;
    user.demoPlayed = true;
    await user.save();

    res.json({ 
      message: 'Demo completed! ₹100 credited to wallet',
      walletBalance: user.walletBalance 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete demo game (remove demo amount)
router.post('/demo/complete', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Remove demo amount after demo play
    if (user.walletBalance >= 100) {
      user.walletBalance -= 100;
      await user.save();
    }

    res.json({ 
      message: 'Demo completed',
      walletBalance: user.walletBalance 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;