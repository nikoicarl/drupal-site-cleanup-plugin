const { query, withTransaction } = require('../config/db');

/**
 * GET /api/products
 * Query params: category, search, vendorId, page, limit
 */
exports.listProducts = async (req, res, next) => {
  try {
    const { category, search, vendorId, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    const conditions = ['p.is_active = TRUE', 'p.deleted_at IS NULL'];

    if (category) {
      params.push(category);
      conditions.push(`p.category_id = $${params.length}`);
    }
    if (vendorId) {
      params.push(vendorId);
      conditions.push(`p.vendor_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(Number(limit), offset);

    const { rows } = await query(
      `SELECT p.id, p.name, p.slug, p.base_price, p.sale_price, p.currency,
              p.rating_avg, p.review_count, p.is_featured,
              c.name AS category,
              pr.display_name AS vendor_name,
              (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS image_url
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN profiles pr ON pr.user_id = p.vendor_id
       ${where}
       ORDER BY p.is_featured DESC, p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 */
exports.getProduct = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, c.name AS category,
              pr.display_name AS vendor_name, pr.avatar_url AS vendor_avatar,
              inv.quantity_available, inv.allow_backorder,
              json_agg(DISTINCT pi.*) FILTER (WHERE pi.id IS NOT NULL) AS images
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN profiles pr ON pr.user_id = p.vendor_id
       LEFT JOIN inventory inv ON inv.product_id = p.id
       LEFT JOIN product_images pi ON pi.product_id = p.id
       WHERE p.id = $1 AND p.deleted_at IS NULL
       GROUP BY p.id, c.name, pr.display_name, pr.avatar_url, inv.quantity_available, inv.allow_backorder`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products  (vendor only)
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      categoryId, name, description, shortDesc, basePrice, salePrice,
      currency = 'CAD', unit, weightGrams, tags, attributes,
      requiresShipping = true, initialQuantity = 0,
    } = req.body;

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const product = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO products
           (vendor_id, category_id, name, slug, description, short_desc,
            base_price, sale_price, currency, unit, weight_grams,
            tags, attributes, requires_shipping)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          req.user.id, categoryId, name, slug, description, shortDesc,
          basePrice, salePrice, currency, unit, weightGrams,
          tags, attributes ? JSON.stringify(attributes) : null, requiresShipping,
        ]
      );
      const p = rows[0];

      await client.query(
        `INSERT INTO inventory (product_id, quantity_available) VALUES ($1, $2)`,
        [p.id, initialQuantity]
      );

      return p;
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/products/:id  (vendor — own products only)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { rows: existing } = await query(
      'SELECT vendor_id FROM products WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );

    if (!existing.length) return res.status(404).json({ error: 'Product not found' });
    if (existing[0].vendor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const allowed = ['name', 'description', 'base_price', 'sale_price', 'is_active', 'tags', 'attributes'];
    const updates = [];
    const values = [];

    for (const field of allowed) {
      const camel = field.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (req.body[camel] !== undefined) {
        values.push(req.body[camel]);
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

    values.push(req.params.id);
    const { rows } = await query(
      `UPDATE products SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/products/:id  (soft delete)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    await query(
      'UPDATE products SET deleted_at = NOW() WHERE id = $1 AND vendor_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Product removed' });
  } catch (err) {
    next(err);
  }
};
