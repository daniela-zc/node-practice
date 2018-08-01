const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');

const promisify = require('es6-promisify');

const mail = require('../handlers/mail');

exports.login = passport.authenticate('local',{
	failreRedirect: '/login',
	failureFlash: 'Failed Login!',
	successRedirect: '/',
	successFlash: 'You Logged in!',
});


exports.logout = (req, res) => {
	req.logout();
	req.flash('sucess','Loged out');
	res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
	if(req.isAuthenticated()){
		next();
		return;
	}
	req.flash('error', 'Not logged in');
	res.redirect('/login');
}

exports.forgot = async ( req, res ) => {
	// 1. check if user exists
	const user = await User.findOne({email: req.body.email});

	if(!user){ 
		req.flash('error', 'No account with taht email exists');
		return res.redirect('/login'); 
	}
	// 2. reset tokens and set expiration date
	user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
	user.resetPasswordExpires = Date.now() + 3600000; // 1 hour  
	await user.save();
	// 3. send email with token
	const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
	
	//send email
	await mail.send({
		user,
		subject: 'Password reset',
		resetURL,
		filename : 'password-reset'
	});

	req.flash('success', `You have been emailed a password reset link. ${resetURL}`);
	// 4. redir to login page
	res.redirect('/login');
}

exports.reset = async (req, res ) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: { $gt : Date.now() }
	});
	if(!user){
		req.flash('error', 'Password reset is invalid or has expired');
		return res.redirect('/login');
	}
	res.render('reset', {title: 'Reset your password'});
}

exports.confirmedPassword = (req, res, next) => {
	// if(req.body.password === req.body['password-confirm']){  // key with  '- 
	if(req.body.password === req.body['password-confirm']){  // key with  '- 
		next();
		return;
	}

	req.flash('error', 'Passwords do not match');
	res.redirect('back');
}


exports.update = async (req, res , next) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: { $gt : Date.now() }
	});
	if(!user){
		req.flash('error', 'Password reset is invalid or has expired');
		return res.redirect('/login');
	}

	const setPassword = promisify(user.setPassword, user); 
	await setPassword(req.body.password);

	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;

	const updatedUser = await user.save();
	await req.login(updatedUser);
	req.flash('success', 'Password reset !!');
	res.redirect('/');
}

