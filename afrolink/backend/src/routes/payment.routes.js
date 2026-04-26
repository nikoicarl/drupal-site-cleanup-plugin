const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Webhook: raw body required — set BEFORE any json parsing (handled in app.js)
router.post('/webhook', ctrl.handleWebhook);

router.post('/intent', authenticate, ctrl.createPaymentIntent);

module.exports = router;
