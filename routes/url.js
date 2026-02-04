// const express = require('express');
// const { handleGenerateNewShortURL, handleGetAnalytics } = require('../controllers/url');
// const router = express.Router();

// router.get('/analytics/:shortId', handleGetAnalytics);
// router.post('/', handleGenerateNewShortURL);

// module.exports = router;


const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  res.send("Hello");
});

module.exports = router;
