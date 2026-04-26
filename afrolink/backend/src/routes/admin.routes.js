const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { query } = require('../config/db');

router.use(authenticate, authorize('admin', 'super_admin'));

// Admin: list all users
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { rows } = await query(
      `SELECT u.id, u.email, u.is_active, u.created_at, r.name AS role,
              pr.display_name, pr.city, pr.country
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit), (Number(page) - 1) * Number(limit)]
    );
    res.json({ data: rows });
  } catch (err) { next(err); }
});

// Admin: suspend/activate a user
router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const { rows } = await query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, is_active',
      [isActive, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// Admin: dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const [users, orders, vendors, revenue] = await Promise.all([
      query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL'),
      query("SELECT COUNT(*) FROM orders WHERE status != 'cancelled'"),
      query("SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'vendor'"),
      query("SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE payment_status = 'paid'"),
    ]);

    res.json({
      totalUsers: Number(users.rows[0].count),
      totalOrders: Number(orders.rows[0].count),
      activeVendors: Number(vendors.rows[0].count),
      totalRevenue: Number(revenue.rows[0].total),
    });
  } catch (err) { next(err); }
});

module.exports = router;
