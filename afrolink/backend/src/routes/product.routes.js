const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', ctrl.listProducts);
router.get('/:id', ctrl.getProduct);
router.post('/', authenticate, authorize('vendor', 'admin'), ctrl.createProduct);
router.patch('/:id', authenticate, authorize('vendor', 'admin'), ctrl.updateProduct);
router.delete('/:id', authenticate, authorize('vendor', 'admin'), ctrl.deleteProduct);

module.exports = router;
