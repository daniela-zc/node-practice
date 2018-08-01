const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const path = require('path');

const transport = nodemailer.createTransport({
	host: process.env.MAIL_HOST,
	port: process.env.MAIL_PORT,
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_PASS, 
	}
});


// transport.sendMail({
// 	from: 'Danie <danieazc@gmail.com>',
// 	to: 'test@test.com',
// 	subject: 'the subject',
// 	html: 'tthe html',
// 	text: 'tthe text'
// });

const generateHTML = (filename , options = {}) => {
	// const _path = path.join(__dirname, 'views', 'email', `${filename}.pug`) ;
	// const html = pug.renderFile(_path, options); // dirname is the position of this file , an dno the reference of th emethod
	const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`);
	const inlined = juice(html); // use juice to make css work in all mail clients
	return inlined;
}


exports.send = async (options) => {
	const html = generateHTML(options.filename, options);
	const mailOptions = {
		from: 'Danie <danieazc@gmail.com>',
		to: options.user.email,
		subject: options.subject,
		html,
		text: htmlToText.fromString(html)
	}
	const sendMail = promisify(transport.sendMail, transport);
	sendMail(mailOptions);
}
