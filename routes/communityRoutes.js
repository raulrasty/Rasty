const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const requireAuth = require('../middleware/requireAuth');

router.get('/top-week', communityController.getTopAlbumsThisWeek);
router.get('/top-rated', communityController.getTopRatedAlbums);
router.get('/following-activity', requireAuth, communityController.getFollowingActivity);
router.get('/following-top-week', requireAuth, communityController.getFollowingTopThisWeek);
router.get('/following-top-rated', requireAuth, communityController.getFollowingTopRated);
router.get('/own-activity', requireAuth, communityController.getOwnActivity);

module.exports = router;