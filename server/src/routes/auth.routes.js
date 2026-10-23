
const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OneSphere authentication routes are ready.',
  });
});

module.exports = router;
