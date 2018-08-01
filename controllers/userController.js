const mongoose = require('mongoose');
const User = mongoose.model('User');

const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
	res.render('login', {title: 'Login Form'});
}

exports.registerForm = (req, res) => {
	res.render('register', {title: 'Register Form'});
}


exports.validateRegister = (req, res, next) => {
	req.sanitizeBody('name'); // expres validator middle ware 
	req.checkBody('name','You must supply a name').notEmpty();
	req.checkBody('email','Not valid email').notEmpty().isEmail();
	req.sanitizeBody('email').normalizeEmail({
		remove_dots: false,
		remove_extention: false,
		gmail_remove_subaddres: false
	});
	req.checkBody('password','Password can not be blank').notEmpty();
	req.checkBody('password-confirm','confirm Password can not be blank').notEmpty();
	req.checkBody('password-confirm','Your passwords do not match').equals(req.body.password);

	const errors = req.validationErrors();
	if(errors){
		req.flash('error', errors.map(err => err.msg));
		res.render('register', {title: 'Register', body: req.body, flashes: req.flash()});
		return;
	}
	next();
}

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  /**
	* passwor is not attached bc is going to be handled by passport-local-mongoose plugin.
	* User.register method comes from passport-local-mongoose plugin too
	* Promisify is used bc when the method comes from  external module/plugin
	* and it is not a function but a callback. Promisify transforms to  promise.
	*/
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next(); // pass to authController.login
};


exports.account = (req, res) => {
	res.render('account', {title: 'Edit your Account'});
}


exports.updateAccount = async (req, res) => {
	const updates = {
		name: req.body.name,
		email: req.body.email
	};

	const user = await User.findOneAndUpdate(
		{ _id : req.user._id }, // query
		{ $set : updates },  //data
		{ new : true , runValidators: true, context: 'query' },  //options
	);
	req.flash('success', 'Profile updated !');
	res.redirect('/account');
}
