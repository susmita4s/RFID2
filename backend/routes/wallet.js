const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');
const razorpay = require('../config/razorpay');

const router = express.Router();
const prisma = new PrismaClient();

// ── POST /api/wallet/create-order ─────────────────────────────────────────────
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const { amount, studentId } = req.body;
    if (!amount || !studentId) {
      return res.status(400).json({ success: false, message: 'Amount and Student ID required' });
    }

    const options = {
      amount: amount * 100, // Amount is in currency subunits (paise)
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({ success: false, message: 'Error generating Razorpay order' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /api/wallet/verify-payment ───────────────────────────────────────────
router.post('/verify-payment', verifyToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, studentId, paymentMethod } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment details' });
  }

  try {
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Process payment - Use transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update or create wallet
      const wallet = await tx.rFIDWallet.upsert({
        where: { studentId: Number(studentId) },
        update: { balance: { increment: parseFloat(amount) } },
        create: { studentId: Number(studentId), balance: parseFloat(amount) },
      });

      // 2. Log transaction history
      const transaction = await tx.walletTransaction.create({
        data: {
          studentId: Number(studentId),
          amount: parseFloat(amount),
          type: 'CREDIT',
          source: 'RECHARGE',
          description: `Wallet Recharge via ${paymentMethod || 'Razorpay'}`,
          // Note: The schema expects certain fields, but we are mapping what we have.
          // Optional fields:
          // payment_id (can be saved if added to schema, currently not in schema)
        }
      });

      return { wallet, transaction };
    });

    res.json({
      success: true,
      message: 'Payment verified and wallet updated successfully',
      wallet: result.wallet,
      transaction: result.transaction
    });

  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during verification' });
  }
});

// ── GET /api/wallet/transactions ─────────────────────────────────────────────
router.get('/transactions', verifyToken, async (req, res) => {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({ success: false, message: 'Student ID required' });
  }

  try {
    const transactions = await prisma.walletTransaction.findMany({
      where: { studentId: Number(studentId) },
      orderBy: { createdAt: 'desc' },
      take: 20 // Return the 20 most recent transactions
    });

    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Fetch Transactions Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
