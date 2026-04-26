// order.routes.js
const express = require('express');
module.exports = (() => {
  const r = express.Router();
  const ctrl = require('../controllers/order.controller');
  const { authenticate, authorize } = require('../middleware/auth.middleware');
  r.use(authenticate);
  r.get('/', ctrl.listOrders);
  r.get('/:id', ctrl.getOrder);
  r.post('/', ctrl.createOrder);
  r.patch('/:id/status', authorize('vendor', 'admin', 'super_admin'), ctrl.updateOrderStatus);
  return r;
})();
