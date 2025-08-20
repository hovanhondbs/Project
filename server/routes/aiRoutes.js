// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { suggestTerms } = require('../controllers/aiController');

router.get('/suggest', suggestTerms);

module.exports = router;
