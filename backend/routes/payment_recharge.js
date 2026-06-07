const express = require('express');
const crypto = require('crypto');
const { verifyToken } = require('./auth');
const razorpay = require('../config/razorpay');

const router = express.Router();
const prisma = require('../prismaClient');
// ── POST /api/payment/create-order ───────────────────────────────────────────
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    // Validate that Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET ||
        process.env.RAZORPAY_KEY_ID === 'rzp_test_SpOhMNYEfkzkuQ') {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured. Please add your own RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from dashboard.razorpay.com to the backend .env file.'
      });
    }

    const { amount, studentId } = req.body;
    if (!amount || !studentId) {
      return res.status(400).json({ success: false, message: 'Amount and Student ID required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid recharge amount' });
    }

    const options = {
      amount: Math.round(parsedAmount * 100), // Amount in paise
      currency: "INR",
      receipt: `receipt_recharge_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({ success: false, message: 'Error generating Razorpay order' });
    }

    res.json({ 
      success: true, 
      order,
      key: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    // Surface the actual Razorpay error message if available
    const msg = error?.error?.description || error?.message || 'Internal server error during order creation';
    const statusCode = error?.statusCode === 401 ? 401 : 500;
    res.status(statusCode).json({ success: false, message: msg });
  }
});


// ── POST /api/payment/verify ──────────────────────────────────────────────────
router.post('/verify', verifyToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, studentId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment signature or details' });
  }

  try {
    // 1. Double-payment prevention (unique check on payment ID recorded in description)
    const duplicate = await prisma.walletTransaction.findFirst({
      where: {
        description: {
          contains: razorpay_payment_id
        }
      }
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: 'This payment has already been successfully processed.' });
    }

    // 2. Verify signature using HMAC SHA256
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
      // Get student's RFID tag
      const studentRecord = await tx.student.findUnique({
        where: { id: Number(studentId) },
        select: { rfidTag: true }
      });
      const rfid = studentRecord?.rfidTag || 'N/A';

      // Update or create wallet
      const wallet = await tx.rFIDWallet.upsert({
        where: { studentId: Number(studentId) },
        update: { balance: { increment: parseFloat(amount) } },
        create: { studentId: Number(studentId), balance: parseFloat(amount) },
      });

      // Log detailed transaction history with packed metadata
      const transaction = await tx.walletTransaction.create({
        data: {
          studentId: Number(studentId),
          amount: parseFloat(amount),
          type: 'CREDIT',
          source: 'RECHARGE',
          description: `Recharge [RFID: ${rfid}] [Payment ID: ${razorpay_payment_id}] [Order ID: ${razorpay_order_id}] [Status: SUCCESS]`,
        }
      });

      // Log payment history under the Payment table
      const paymentLog = await tx.payment.create({
        data: {
          studentId: Number(studentId),
          amount: parseFloat(amount),
          type: 'other',
          description: `Wallet Recharge (Payment ID: ${razorpay_payment_id})`,
          status: 'paid',
          paidAt: new Date(),
        }
      });

      return { wallet, transaction, paymentLog };
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

module.exports = router;
