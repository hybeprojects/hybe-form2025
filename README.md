require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.use(express.json());
app.use(express.static('public')); // Serve static files

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { paymentType, userId, referralCode, email, fullName } = req.body;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (referralCode && !/^[A-Z0-9]{6,10}$/.test(referralCode)) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: paymentType === 'Installment' ? 'price_installment_id' : 'price_full_id', // Replace with actual Stripe price IDs
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://your-site.com/success',
      cancel_url: 'https://your-site.com/cancel',
      metadata: { userId, referralCode, email, fullName },
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment session' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));