const express = require('express');
const crypto = require('crypto');
const { verifyToken } = require('./auth');
const prisma = require('../prismaClient');

const router = express.Router();

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT86';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || '96434309-7796-489d-8924-ab56988a6076';
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const BASE_URL = process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const BACKEND_URL = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace('3000', '5000') : 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── POST /api/payment/phonepe/initiate ────────────────────────────────────────
// Initiates a PhonePe payment, returns a redirect URL for the browser
router.post('/initiate', verifyToken, async (req, res) => {
  try {
    const { amount, studentId } = req.body;

    if (!amount || !studentId) {
      return res.status(400).json({ success: false, message: 'Amount and Student ID are required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid recharge amount' });
    }

    const merchantTransactionId = `RFID_${studentId}_${Date.now()}`;
    const amountInPaise = Math.round(parsedAmount * 100);

    // ✅ FIX: Embed merchantTransactionId in the redirect URL so it's always
    // present when PhonePe sends the browser back — PhonePe does NOT guarantee
    // appending it as a query param on its own.
    const redirectUrl = `${BACKEND_URL}/api/payment/phonepe/callback?merchantTransactionId=${merchantTransactionId}`;
    const callbackUrl = `${BACKEND_URL}/api/payment/phonepe/webhook`;

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: `PARENT_${req.user.id}`,
      amount: amountInPaise,
      redirectUrl,
      redirectMode: 'REDIRECT',
      callbackUrl,
      mobileNumber: '9999999999', // placeholder — use real number if available
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    // Encode payload to Base64
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');

    // Generate X-VERIFY header: SHA256(base64Payload + endpoint + saltKey) + ### + saltIndex
    const endpoint = '/pg/v1/pay';
    const stringToHash = payloadBase64 + endpoint + SALT_KEY;
    const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const xVerify = `${sha256Hash}###${SALT_INDEX}`;

    // Call PhonePe Pay API
    const response = await fetch(`${BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'accept': 'application/json',
      },
      body: JSON.stringify({ request: payloadBase64 }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('PhonePe initiate error:', data);
      return res.status(502).json({
        success: false,
        message: data.message || 'Failed to initiate PhonePe payment',
      });
    }

    const redirectPayUrl = data.data?.instrumentResponse?.redirectInfo?.url;

    if (!redirectPayUrl) {
      return res.status(502).json({ success: false, message: 'PhonePe did not return a redirect URL' });
    }

    // Store pending transaction info temporarily in a transaction record
    // We'll use description to carry merchantTransactionId and studentId for the callback
    await prisma.walletTransaction.create({
      data: {
        studentId: Number(studentId),
        amount: parsedAmount,
        type: 'PENDING',
        source: 'RECHARGE',
        description: `PHONEPE_PENDING|${merchantTransactionId}|${studentId}|${parsedAmount}`,
      },
    });

    res.json({
      success: true,
      redirectUrl: redirectPayUrl,
      merchantTransactionId,
    });

  } catch (error) {
    console.error('PhonePe Initiate Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during PhonePe initiation' });
  }
});

// ── GET /api/payment/phonepe/callback ─────────────────────────────────────────
// Browser redirect callback from PhonePe — verifies with PhonePe Status API and updates DB
router.get('/callback', async (req, res) => {
  const { merchantTransactionId, transactionId, amount, providerReferenceId, merchantId } = req.query;

  if (!merchantTransactionId) {
    return res.redirect(`${FRONTEND_URL}/?payment=failed&message=Missing+transaction+ID`);
  }

  try {
    // Verify payment status with PhonePe Status API
    const statusEndpoint = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`;
    const statusStringToHash = statusEndpoint + SALT_KEY;
    const statusHash = crypto.createHash('sha256').update(statusStringToHash).digest('hex');
    const statusXVerify = `${statusHash}###${SALT_INDEX}`;

    const statusResponse = await fetch(`${BASE_URL}${statusEndpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': statusXVerify,
        'X-MERCHANT-ID': MERCHANT_ID,
        'accept': 'application/json',
      },
    });

    const statusData = await statusResponse.json();

    if (!statusData.success || statusData.code !== 'PAYMENT_SUCCESS') {
      console.error('PhonePe status verification failed:', statusData);
      // Clean up pending transaction
      await prisma.walletTransaction.deleteMany({
        where: { description: { contains: `PHONEPE_PENDING|${merchantTransactionId}` } },
      });
      return res.redirect(`${FRONTEND_URL}/?payment=failed&message=${encodeURIComponent(statusData.message || 'Payment not successful')}`);
    }

    // Retrieve the pending wallet transaction to get studentId and amount
    const pendingTx = await prisma.walletTransaction.findFirst({
      where: { description: { contains: `PHONEPE_PENDING|${merchantTransactionId}` } },
    });

    if (!pendingTx) {
      return res.redirect(`${FRONTEND_URL}/?payment=failed&message=Transaction+record+not+found`);
    }

    // Double-payment guard: check if a SUCCESS record already exists for this merchantTransactionId
    const alreadyProcessed = await prisma.walletTransaction.findFirst({
      where: { description: { contains: `PHONEPE_SUCCESS|${merchantTransactionId}` } },
    });

    if (alreadyProcessed) {
      return res.redirect(`${FRONTEND_URL}/?payment=success&amount=${pendingTx.amount}&gateway=phonepe`);
    }

    const studentId = pendingTx.studentId;
    const rechargeAmount = pendingTx.amount;

    // Process in a Prisma transaction for data integrity
    await prisma.$transaction(async (tx) => {
      // Update wallet balance
      await tx.rFIDWallet.upsert({
        where: { studentId: Number(studentId) },
        update: { balance: { increment: rechargeAmount } },
        create: { studentId: Number(studentId), balance: rechargeAmount },
      });

      // Replace PENDING log with SUCCESS log
      await tx.walletTransaction.updateMany({
        where: { description: { contains: `PHONEPE_PENDING|${merchantTransactionId}` } },
        data: {
          type: 'CREDIT',
          description: `PHONEPE_SUCCESS|${merchantTransactionId}|Wallet Recharge via PhonePe`,
        },
      });

      // Also log in the Payment table for admin visibility
      await tx.payment.create({
        data: {
          studentId: Number(studentId),
          amount: rechargeAmount,
          type: 'other',
          description: `Wallet Recharge via PhonePe (Txn: ${merchantTransactionId})`,
          status: 'paid',
          paidAt: new Date(),
        },
      });
    });

    console.log(`✅ PhonePe payment success: ${merchantTransactionId}, ₹${rechargeAmount} for student ${studentId}`);

    // Redirect to frontend with success params
    return res.redirect(`${FRONTEND_URL}/?payment=success&amount=${rechargeAmount}&gateway=phonepe`);

  } catch (error) {
    console.error('PhonePe Callback Error:', error);
    return res.redirect(`${FRONTEND_URL}/?payment=failed&message=${encodeURIComponent('Server error during verification')}`);
  }
});

// ── POST /api/payment/phonepe/webhook ──────────────────────────────────────────
// Server-to-server webhook (optional — same logic as callback)
router.post('/webhook', async (req, res) => {
  try {
    const { response: encodedResponse } = req.body;
    if (!encodedResponse) {
      return res.status(400).json({ success: false });
    }

    const decodedPayload = JSON.parse(Buffer.from(encodedResponse, 'base64').toString('utf-8'));
    console.log('PhonePe Webhook Received:', decodedPayload);

    // Acknowledge receipt
    res.json({ success: true });
  } catch (error) {
    console.error('PhonePe Webhook Error:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;

