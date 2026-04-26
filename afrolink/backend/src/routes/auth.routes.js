const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');

// Stricter rate limit for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // max 10 attempts per window
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  validate,
  ctrl.register
);

router.post('/login',
  authLimiter,
  body('email').isEmail(),
  body('password').notEmpty(),
  validate,
  ctrl.login
);

router.post('/refresh',
  body('refreshToken').notEmpty(),
  validate,
  ctrl.refresh
);

// logout requires a valid access token
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;
