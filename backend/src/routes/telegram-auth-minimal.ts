import express from 'express';

const router = express.Router();

router.get('/telegram-minimal-test', (req, res) => {
  res.json({ message: 'Minimal telegram routes working!' });
});

router.get('/telegram-auth-callback', (req, res) => {
  res.json({ 
    message: 'Telegram auth callback working!',
    query: req.query 
  });
});

export default router;