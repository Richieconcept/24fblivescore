import express from 'express';
import { getLiveMatchesController, getScheduledMatchesController,  fetchAllMatchesController, 
    getFinishedMatchesController, getMatchDetailsController, } from '../controllers/matchController.js';


const router = express.Router();

// GET /matches/live
router.get('/live', getLiveMatchesController,);
// router.get('/schedulled', fetchFinishedMatches);
router.get('/scheduled-matches', getScheduledMatchesController);
router.get('/all-matches', fetchAllMatchesController);
router.get('/finished', getFinishedMatchesController);
router.get('/match-details', getMatchDetailsController);






export default router;