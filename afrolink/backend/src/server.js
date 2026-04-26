require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Verify DB connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('✅  PostgreSQL connected');

    app.listen(PORT, () => {
      logger.info(`🚀  AfroLink API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('❌  Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
