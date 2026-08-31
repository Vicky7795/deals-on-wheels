const express = require('express');
const router = express.Router();
const { addFavorite, removeFavorite, getBuyerFavorites } = require('../controllers/favoriteController');
const { authenticateUser, requireBuyer } = require('../middleware/auth');

router.use(authenticateUser, requireBuyer);

router.get('/', getBuyerFavorites);
router.post('/:vehicleId', addFavorite);
router.delete('/:vehicleId', removeFavorite);

module.exports = router;
