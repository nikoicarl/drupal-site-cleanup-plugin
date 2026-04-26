const router = require('express').Router();
const ctrl = require('../controllers/delivery.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/jobs', authorize('driver'), ctrl.listAvailableJobs);
router.get('/my', authorize('driver'), ctrl.myDeliveries);
router.patch('/:id/accept', authorize('driver'), ctrl.acceptJob);
router.patch('/:id/status', authorize('driver'), ctrl.updateDeliveryStatus);

module.exports = router;
