const express = require('express');

const router = express.Router();

const { getRoomsData } = require('../controllers/roomController');

router.get('/', (req, res) => {
  const rooms = getRoomsData();
  // making it string friendly
  // rooms.competition.timer = "[TIMER]";
  // rooms.competition.veto.timer = "[TIMER]";
  // rooms.competition.veto.resolver = "[RESOLVER]";

  res.header('Content-Type', 'application/json');
  res.send(`${JSON.stringify(rooms, null, 4)}`);
});

module.exports = router;

// thanks alan for testing
