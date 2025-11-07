const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const userFavouritesController = require('../controllers/userFavouritesController');

// All routes require authentication
router.use(protect);

// Get all favourites (teams + leagues)
router.get('/all', userFavouritesController.getAllFavourites);

// Favourite Teams routes
router.get('/teams', userFavouritesController.getFavouriteTeams);
router.post('/teams', userFavouritesController.addFavouriteTeam);
router.delete('/teams/:teamId', userFavouritesController.removeFavouriteTeam);

// Favourite Leagues routes (Pro feature)
router.get('/leagues', userFavouritesController.getFavouriteLeagues);
router.post('/leagues', userFavouritesController.addFavouriteLeague);
router.delete('/leagues/:league', userFavouritesController.removeFavouriteLeague);

module.exports = router;
