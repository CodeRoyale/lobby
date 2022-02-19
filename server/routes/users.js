const express = require('express');

const router = express.Router();

const { getUsersData } = require('../controllers/userController');

router.get('/', async (req, res) => {
  res.header('Content-Type', 'application/json');
  res.send(
    `CodeRoyale Lobby Server is up and running. ${JSON.stringify(
      await getUsersData(),
      null,
      4
    )}`
  );
});

module.exports = router;
