import { Router } from 'express';

const router = Router();

// Endpoint placeholder - will fail the test by not calling getToken and returning 200
router.get('/google/callback', (req, res) => {
    // Left empty for TDD Red Phase, but return a response to prevent test timeout
    res.status(200).send('OK');
});

export default router;
