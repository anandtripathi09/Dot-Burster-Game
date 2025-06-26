import express from 'express';
import multer from 'multer';
import User from '../models/User.js';
import Game from '../models/Game.js';
import Payment from '../models/Payment.js';
import Admin from '../models/Admin.js';
import { adminProtect } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Get dashboard stats
router.get('/stats', adminProtect, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGames = await Game.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const totalRevenue = await Game.aggregate([
      { $match: { status: 'finished' } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } }
    ]);

    res.json({
      totalUsers,
      totalGames,
      pendingPayments,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', adminProtect, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all payments
router.get('/payments', adminProtect, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Reject payment
router.post('/payments/:id/status', adminProtect, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = status;
    payment.adminNotes = adminNotes;
    payment.processedBy = req.admin.id;
    payment.processedAt = new Date();
    await payment.save();

    // If approved and deposit, credit user wallet
    if (status === 'approved' && payment.type === 'deposit') {
      const user = await User.findById(payment.userId);
      user.walletBalance += payment.amount;
      await user.save();
    }

    res.json({ message: 'Payment status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload QR and UPI details
router.post('/payment-details', adminProtect, upload.single('qrImage'), async (req, res) => {
  try {
    const { upiId } = req.body;
    const admin = await Admin.findById(req.admin.id);
    
    if (req.file) {
      admin.qrImage = req.file.filename;
    }
    if (upiId) {
      admin.upiId = upiId;
    }
    
    await admin.save();
    
    res.json({ 
      message: 'Payment details updated',
      qrImage: admin.qrImage,
      upiId: admin.upiId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payment details
router.get('/payment-details', adminProtect, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    res.json({
      qrImage: admin.qrImage,
      upiId: admin.upiId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;