const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/db');

/**
 * POST /api/payments/intent
 * Creates a Stripe PaymentIntent for an existing order.
 */
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const { rows } = await query(
      'SELECT id, total_amount, currency, user_id FROM orders WHERE id = $1',
      [orderId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = rows[0];

    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total_amount * 100), // cents
      currency: order.currency.toLowerCase(),
      metadata: { orderId: order.id, userId: req.user.id },
    });

    // Record payment attempt — uses schema column names: method, gateway_ref
    await query(
      `INSERT INTO payments (order_id, user_id, method, gateway_ref, amount, currency, status)
       VALUES ($1, $2, 'stripe', $3, $4, $5, 'pending')
       ON CONFLICT (gateway_ref) DO NOTHING`,
      [order.id, req.user.id, paymentIntent.id, order.total_amount, order.currency]
    );

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payments/webhook
 * Stripe sends events here. Must be registered BEFORE express.json() in app.js.
 */
exports.handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const { orderId } = pi.metadata;

        // uses schema column name: gateway_ref
        await query(
          `UPDATE payments SET status = 'succeeded', paid_at = NOW()
           WHERE gateway_ref = $1`,
          [pi.id]
        );
        await query(
          `UPDATE orders SET status = 'confirmed', payment_status = 'paid', updated_at = NOW()
           WHERE id = $1`,
          [orderId]
        );
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        await query(
          `UPDATE payments SET status = 'failed' WHERE gateway_ref = $1`,
          [pi.id]
        );
        break;
      }
      default:
        // Unhandled event type — ignore
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};
