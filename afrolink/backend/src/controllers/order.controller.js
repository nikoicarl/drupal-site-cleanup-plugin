const { query, withTransaction } = require('../config/db');

/** Generate a unique human-readable order number */
const makeOrderNumber = () =>
  `AFRO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

/**
 * POST /api/orders
 * Body: { items: [{ productId, quantity }], shippingAddress: {...}, notes? }
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, billingAddress, notes } = req.body;

    if (!items?.length) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ error: 'shippingAddress is required' });
    }

    const order = await withTransaction(async (client) => {
      let subtotal = 0;
      // Fetch all products in one query to avoid N+1
      const productIds = items.map(i => i.productId);
      const { rows: products } = await client.query(
        `SELECT p.id, p.base_price, p.sale_price, p.vendor_id,
                inv.quantity_available, inv.allow_backorder
         FROM products p
         JOIN inventory inv ON inv.product_id = p.id
         WHERE p.id = ANY($1::uuid[]) AND p.is_active AND p.deleted_at IS NULL`,
        [productIds]
      );

      const productMap = Object.fromEntries(products.map(p => [p.id, p]));

      for (const item of items) {
        const product = productMap[item.productId];
        if (!product) {
          throw Object.assign(new Error(`Product ${item.productId} not found`), { status: 404 });
        }
        if (!product.allow_backorder && product.quantity_available < item.quantity) {
          throw Object.assign(
            new Error(`Insufficient stock for product ${item.productId}`),
            { status: 409 }
          );
        }

        // Reserve stock
        await client.query(
          `UPDATE inventory
           SET quantity_available = quantity_available - $1,
               quantity_reserved  = quantity_reserved  + $1
           WHERE product_id = $2`,
          [item.quantity, item.productId]
        );

        const price = product.sale_price ?? product.base_price;
        subtotal += price * item.quantity;
      }

      const total = subtotal; // tax / discount logic can be added here

      const { rows: orderRows } = await client.query(
        `INSERT INTO orders
           (order_number, user_id, subtotal, total_amount, currency,
            status, payment_status, shipping_address, billing_address, notes)
         VALUES ($1,$2,$3,$4,'CAD','pending','unpaid',$5,$6,$7)
         RETURNING *`,
        [
          makeOrderNumber(), req.user.id,
          subtotal, total,
          JSON.stringify(shippingAddress),
          billingAddress ? JSON.stringify(billingAddress) : null,
          notes ?? null,
        ]
      );
      const newOrder = orderRows[0];

      // Insert order items
      for (const item of items) {
        const product = productMap[item.productId];
        const unitPrice = product.sale_price ?? product.base_price;
        await client.query(
          `INSERT INTO order_items
             (order_id, product_id, vendor_id, quantity, unit_price, total_price)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [newOrder.id, item.productId, product.vendor_id,
           item.quantity, unitPrice, unitPrice * item.quantity]
        );
      }

      return newOrder;
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders
 * Query params: status, page, limit
 */
exports.listOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const params = [req.user.id];
    let where = 'WHERE o.user_id = $1';

    if (status) {
      params.push(status);
      where += ` AND o.status = $${params.length}`;
    }

    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const { rows } = await query(
      `SELECT o.id, o.order_number, o.status, o.payment_status,
              o.total_amount, o.currency, o.placed_at,
              COUNT(oi.id)::INT AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id
       ORDER BY o.placed_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/:id
 */
exports.getOrder = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.*,
              json_agg(json_build_object(
                'id',          oi.id,
                'product_id',  oi.product_id,
                'product_name', p.name,
                'quantity',    oi.quantity,
                'unit_price',  oi.unit_price,
                'total_price', oi.total_price,
                'status',      oi.status,
                'image_url',   (
                  SELECT url FROM product_images
                  WHERE product_id = p.id AND is_primary = TRUE
                  LIMIT 1
                )
              )) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/orders/:id/status  (admin / vendor)
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      'confirmed', 'preparing', 'ready', 'shipped',
      'delivered', 'cancelled', 'refunded',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { rows } = await query(
      `UPDATE orders SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
