const { Router } = require('express');
const router = Router();

// Import Controllers
const dbFixController = require('../controllers/dbFixController');

const seedController = require('../controllers/seedController');

const dbDropController = require('../controllers/dbDropController');
 
router.get(
	'/dbfix',
	dbFixController.dbfix
);  

router.get(
	'/seed',
	seedController.seedData
);

router.get(
	'/dbDrop',
	dbDropController.dbDrop
);

module.exports = router;