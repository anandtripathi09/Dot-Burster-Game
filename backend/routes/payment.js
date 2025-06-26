import express from 'express';
import multer from 'multer';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for payment screenshots
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payments/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Get payment details for users
router.get('/details', protect, async (req, res) => {
  try {
    const admin = await Admin.findOne();
    res.json({
      qrImage: admin?.qrImage,
      upiId: admin?.upiId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit deposit request
router.post('/deposit', protect, upload.single('screenshot'), async (req, res) => {
  try {
    const { amount, transactionId, upiId } = req.body;
    
    if (amount < 100) {
      return res.status(400).json({ message: 'Minimum deposit is ₹100' });
    }

    const payment = new Payment({
      userId: req.user.id,
      type: 'deposit',
      amount: parseInt(amount),
      transactionId,
      upiId,
      screenshot: req.file?.filename
    });

    await payment.save();
    
    res.json({ message: 'Deposit request submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit withdrawal request
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { amount, upiId } = req.body;
    const user = req.user;
    
    if (user.walletBalance < 700) {
      return res.status(400).json({ message: 'Minimum wallet balance of ₹700 required for withdrawal' });
    }
    
    if (amount > user.walletBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const payment = new Payment({
      userId: user.id,
      type: 'withdrawal',
      amount: parseInt(amount),
      upiId
    });

    await payment.save();
    
    res.json({ message: 'Withdrawal request submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's payment history
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;