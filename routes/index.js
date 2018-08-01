const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const reviewController = require('../controllers/reviewController');

// Do work here
// no ES6 : router.get('/', function(req, res) {
router.get('/test', (req, res) => {
  // res.send('Hey! It works!');

  // var obj = {name: 'Danie', age: 26, cool: true };
  // res.json(obj);

	// res.json(req.query);
	res.render('hello', {
		name: 'Danie',
		dog: req.query.dog
	});
});

// Testing with routes and params
router.get('/reverse/:name',(req, res) => {
	const reverse = [...req.params.name].reverse().join('');
	// res.send(req.params);
	res.send(reverse);
	// res.send([...req.params.name]); // prints an array of the parma letters

});

/// Usimg Midleware

// router.get('/', storeController.myMiddleware, storeController.homePage);

const {catchErrors} = require('../handlers/errorHandlers');

// router.get('/', storeController.homePage);
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));

router.get('/stores/page/:page', catchErrors(storeController.getStores));

router.get('/add', 
	authController.isLoggedIn,
	storeController.addStore
);

// composition = wrapping a function
router.post('/add', storeController.upload,
	catchErrors(storeController.resize),
	catchErrors(storeController.createStore)
);

router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.post('/add/:id',
	storeController.upload,
	catchErrors(storeController.resize),
	catchErrors(storeController.updateStore)
);

router.get('/store/:slug',catchErrors(storeController.getStoreBySlug));

router.get('/tags',catchErrors(storeController.getStoreByTag));
router.get('/tags/:tag',catchErrors(storeController.getStoreByTag));

// Users
router.get('/login',userController.loginForm);
router.post('/login',authController.login);

router.get('/register',userController.registerForm);

router.post('/register',
  userController.validateRegister,
  catchErrors(userController.register),
  authController.login
);

// router.get('/register_test',userController.testRegisterPost);

router.get('/logout', authController.logout);

//account
router.get('/account', userController.account);
router.post('/account', 
	authController.isLoggedIn,
	userController.updateAccount
);

router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token', 
	authController.confirmedPassword,
	catchErrors(authController.update)
);

router.get('/map', storeController.mapPage);

router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getHearts));

router.post('/reviews/:id', authController.isLoggedIn, catchErrors(reviewController.addReview));

router.get('/top', catchErrors(storeController.getTopStores));

/**
* API
*/
router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;
