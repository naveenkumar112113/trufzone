import { Router } from 'express';
import { getTurfs, getTurfDetails, getTurfSlots, getAllSports } from '../controllers/turfController';

const router = Router();

router.get('/', getTurfs);
router.get('/sports/all', getAllSports);
router.get('/:id', getTurfDetails);
router.get('/:id/slots', getTurfSlots);

export default router;
