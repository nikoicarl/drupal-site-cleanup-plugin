const { query } = require('../config/db');

/**
 * Helper — resolves the delivery_vendors.id for the authenticated driver.
 * delivery_jobs.vendor_id is a FK to delivery_vendors(id), NOT users(id).
 */
const getDeliveryVendorId = async (userId) => {
  const { rows } = await query(
    'SELECT id FROM delivery_vendors WHERE user_id = $1',
    [userId]
  );
  if (!rows.length) return null;
  return rows[0].id;
};

/**
 * GET /api/deliveries/jobs
 * Lists jobs with status 'unassigned' that drivers can pick up.
 */
exports.listAvailableJobs = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT dj.id, dj.order_id, dj.pickup_address, dj.dropoff_address,
              dj.distance_km, dj.estimated_minutes, dj.delivery_fee,
              dj.created_at,
              o.total_amount, o.status AS order_status
       FROM delivery_jobs dj
       JOIN orders o ON o.id = dj.order_id
       WHERE dj.status = 'unassigned'
       ORDER BY dj.created_at ASC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/deliveries/:id/accept
 * Driver claims an unassigned job.
 */
exports.acceptJob = async (req, res, next) => {
  try {
    const vendorId = await getDeliveryVendorId(req.user.id);
    if (!vendorId) {
      return res.status(403).json({ error: 'Driver profile not found. Please complete your driver registration.' });
    }

    const { rows } = await query(
      `UPDATE delivery_jobs
       SET status = 'assigned', vendor_id = $1, assigned_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND status = 'unassigned'
       RETURNING *`,
      [vendorId, req.params.id]
    );

    if (!rows.length) {
      return res.status(409).json({ error: 'Job no longer available' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/deliveries/:id/status
 * Body: { status }  — picked_up | in_transit | delivered | failed
 */
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status, failureReason } = req.body;
    const validStatuses = ['picked_up', 'in_transit', 'delivered', 'failed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid delivery status' });
    }

    const vendorId = await getDeliveryVendorId(req.user.id);
    if (!vendorId) {
      return res.status(403).json({ error: 'Driver profile not found' });
    }

    const { rows } = await query(
      `UPDATE delivery_jobs
       SET status       = $1,
           picked_up_at = CASE WHEN $1 = 'picked_up'  THEN NOW() ELSE picked_up_at END,
           delivered_at = CASE WHEN $1 = 'delivered'   THEN NOW() ELSE delivered_at END,
           failed_at    = CASE WHEN $1 = 'failed'      THEN NOW() ELSE failed_at    END,
           failure_reason = CASE WHEN $1 = 'failed'    THEN $4    ELSE failure_reason END,
           updated_at   = NOW()
       WHERE id = $2 AND vendor_id = $3
       RETURNING *`,
      [status, req.params.id, vendorId, failureReason ?? null]
    );

    if (!rows.length) return res.status(404).json({ error: 'Delivery job not found' });

    // Mirror status to the parent order
    if (status === 'delivered') {
      await query(
        `UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = $1`,
        [rows[0].order_id]
      );
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/deliveries/my
 * Driver's own delivery history.
 */
exports.myDeliveries = async (req, res, next) => {
  try {
    const vendorId = await getDeliveryVendorId(req.user.id);
    if (!vendorId) {
      return res.json([]);
    }

    const { rows } = await query(
      `SELECT dj.id, dj.order_id, dj.status,
              dj.delivery_fee, dj.distance_km, dj.estimated_minutes,
              dj.assigned_at, dj.picked_up_at, dj.delivered_at,
              dj.created_at,
              o.total_amount, o.placed_at
       FROM delivery_jobs dj
       JOIN orders o ON o.id = dj.order_id
       WHERE dj.vendor_id = $1
       ORDER BY dj.created_at DESC
       LIMIT 50`,
      [vendorId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
