const router = require('express').Router();
const ctrl = require('../controllers/community.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/posts', ctrl.listPosts);
router.post('/posts', authenticate, ctrl.createPost);
router.get('/recipes', ctrl.listRecipes);
router.get('/recipes/:id', ctrl.getRecipe);

module.exports = router;
