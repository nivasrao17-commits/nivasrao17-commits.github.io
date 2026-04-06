const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Your GitHub Pages URL (update after deploying)
const SITE_URL = process.env.SITE_URL || 'https://your-username.github.io/your-repo';

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lineItems, customer } = req.body;

    if (!lineItems || !lineItems.length) {
      return res.status(400).json({ error: 'No items in cart' });
    }
    if (!customer || !customer.email || !customer.name) {
      return res.status(400).json({ error: 'Customer info required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customer.email,
      metadata: {
        customer_name: customer.name,
        customer_phone: customer.phone,
        delivery_address: customer.address,
      },
      line_items: lineItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: item.amount,  // already in cents
        },
        quantity: item.quantity,
      })),
      success_url: `${SITE_URL}?payment=success`,
      cancel_url: `${SITE_URL}?payment=cancelled`,
    });

    return res.status(200).json({ sessionId: session.id });

  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
