const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { verifyAuth, verifyRole } = require('../middlewares/authMiddleware');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', verifyAuth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Premium Subscription',
              description: 'Unlock all private AI prompts.',
            },
            unit_amount: 500, // $5.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout`,
      client_reference_id: req.user.id,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/verify-payment', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid' && session.client_reference_id === req.user.id) {
      // Check if payment already exists
      const existingPayment = await Payment.findOne({ transactionId: sessionId });
      if (existingPayment) {
        return res.json({ success: true, message: 'Already upgraded' });
      }

      // Record payment
      const payment = new Payment({
        user: req.user.id,
        amount: session.amount_total / 100, // convert from cents
        transactionId: sessionId,
      });
      await payment.save();

      // Upgrade user
      await User.findByIdAndUpdate(req.user.id, { subscription: 'Premium' });
      
      res.json({ success: true, message: 'Upgraded to Premium!' });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/admin', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    const payments = await Payment.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
