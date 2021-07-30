const express = require('express');

const router = express.Router();

const { getUserData } = require('../controllers/userController');

router.get('/', (req, res) => {
  res.header('Content-Type', 'application/json');
  res.send(
    `CodeRoyale Lobby Server is up and running. ${JSON.stringify(
      getUserData(),
      null,
      4
    )}`
  );
});

module.exports = router;
