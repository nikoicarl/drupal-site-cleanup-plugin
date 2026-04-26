const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { query } = require('../config/db');

router.use(authenticate);

// GET /api/users/me
router.get('/me', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.phone, u.is_email_verified, u.created_at,
              r.name AS role,
              row_to_json(pr.*) AS profile
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/users/me
router.patch('/me', async (req, res, next) => {
  try {
    const allowed = ['first_name','last_name','display_name','bio','city','country','avatar_url'];
    const updates = [];
    const values = [];

    for (const field of allowed) {
      const camel = field.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (req.body[camel] !== undefined) {
        values.push(req.body[camel]);
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    values.push(req.user.id);
    const { rows } = await query(
      `UPDATE profiles SET ${updates.join(', ')}, updated_at = NOW()
       WHERE user_id = $${values.length} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
