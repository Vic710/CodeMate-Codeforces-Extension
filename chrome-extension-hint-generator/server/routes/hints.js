const express = require('express');
const router = express.Router();
const { generateHint } = require('../services/ml');
const { scrapeProblem } = require('../services/scraper');

router.post('/problem', async (req, res) => {
    try {
        const { url } = req.body;
        const problem = await scrapeProblem(url);
        const hint = await generateHint(problem);
        res.json({ hint });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;