const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, withTransaction } = require('../config/db');

const SALT_ROUNDS = 12;

// Roles users are allowed to self-register as.
// admin / super_admin / moderator must be granted by an existing admin.
const ALLOWED_SELF_REGISTER_ROLES = ['customer', 'vendor', 'driver'];

// ── Helpers ────────────────────────────────────────────────

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refreshToken = jwt.sign(
    { sub: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  return { accessToken, refreshToken };
};

// ── Controllers ────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { email, password, firstName, lastName, role? }
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role = 'customer' } = req.body;

    // Only allow self-registration for safe roles
    if (!ALLOWED_SELF_REGISTER_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Resolve role id
    const roleRow = await query('SELECT id FROM roles WHERE name = $1', [role]);
    if (!roleRow.rows.length) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (email, password_hash, role_id)
         VALUES ($1, $2, $3)
         RETURNING id, email`,
        [email.toLowerCase(), passwordHash, roleRow.rows[0].id]
      );
      const newUser = rows[0];

      await client.query(
        `INSERT INTO profiles (user_id, first_name, last_name)
         VALUES ($1, $2, $3)`,
        [newUser.id, firstName, lastName]
      );

      return newUser;
    });

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.status(201).json({
      message: 'Account created successfully',
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query(
      `SELECT u.id, u.email, u.password_hash, u.is_active, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1 AND u.deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Verify the user still exists and is active before issuing new tokens
    const { rows } = await query(
      `SELECT u.id, u.is_active
       FROM users u
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [decoded.sub]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.sub);

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(err);
  }
};

/**
 * POST /api/auth/logout  (requires authenticate middleware)
 */
exports.logout = async (req, res) => {
  // Stateless JWT — client discards tokens.
  // If using sessions table, invalidate the session here.
  res.json({ message: 'Logged out successfully' });
};
