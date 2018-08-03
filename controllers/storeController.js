const mongoose = require ('mongoose');
const Store = mongoose.model("Store");
const User = mongoose.model("User");

//for uploading files
const multer = require('multer');
const multerOptions = {
	storage: multer.memoryStorage(),
	fileFilter (req , file, next){
		const isPhoto = file.mimetype.startsWith('image/');  //mimetype is the real type of a file
		if(isPhoto){
			next(null, true); // next with null is no error, second param : true is the result for the next call
		} else{
			next({message: 'file not allowed'}, false);
		}
	}
};

const jimp = require ('jimp'); // to resize images
const uuid = require ('uuid'); // to save always unique ids of files


exports.myMiddleware = (req, res, next) => {
	req.name = "DANIE";
	next();
};

exports.homePage =  (req, res) => {
	res.render('index');
};

exports.addStore = (req, res) => {
	res.render('editStore', {title : 'Add Store'});
}

// exports.createStore = (req, res) => {
// 	// res.json(req.body);
// 	const store = new Store(req.body);
// 	// store.save(funciton (err, store){
// 	// 	if(!err){
// 	// 		console.log('works');
// 	// 		res.redirect('/');
// 	// 	}
// 	// });

// 	store
// 		.save()
// 		.then(store => {
// 			 return store.find(); // stores
// 		})
// 		.then(stores => {
// 			res.rendder('storeList', {stores : stores});
// 		})
// 		.catch(err => {
// 			throw Error(err);
// 		})
// 	console.log('works');


// }
exports.upload = multer(multerOptions).single('photo');

exports.resize = async(req, res, next) => {
	// check if there is new file to rezise 
	if(!req.file){
		next(); // go to next midleware
		return;
	}
	const extension = req.file.mimetype.split('/')[1];
	req.body.photo = `${uuid.v4()}.${extension}`;
	// resize
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	next();
};


exports.createStore =  async (req, res) => {
	req.body.author = req.user._id;
	// res.json(req.body);
	// const store = new Store(req.body);
	// await store.save();
	const store = await (new Store(req.body)).save();
	console.log('works');
	req.flash('success', `Succesfully created ${store.name}`);
	res.redirect(`/store/${store.slug}`);
}


exports.getStores = async (req , res) => {

	const page = req.params.page || 1;
	const limit = 4;
	const skip = (page * limit) - limit;

	// 1. query db for stores
	// const stores = await Store
	// .find()
	// .skip(skip)
	// .limit(limit);

	const storesPromise = Store
	.find()
	.skip(skip)
	.limit(limit);
	// .sort({created: 'desc '});

	const counterPromise = Store.count();
	const [stores, count] = await Promise.all([storesPromise, counterPromise]);
	const pages = Math.ceil(count / limit);

	if(!stores.length && skip){
		req.flash('info', `Hey ! Page ${page} does not exist. Redirecting to page ${pages}`);
		res.redirect(`/stores/page/${pages}`);
		return;
	}

	res.render('stores', {title: 'Stores', stores, page, pages, count});
}

exports.editStore = async(req, res) => {
	// 1 find store by id
	// res.json(req.params);
	const store = await Store.findOne({_id: req.params.id});
	// res.json(store);
	// 2 owner of the store
	confirmOwner(store, req.user);

	// 3 render edit form
	res.render('editStore', {title: `Edit store ${store.name}`, store});
}

const confirmOwner = (store, user) => {
	if(!store.author.equals(user._id)){ // to compare ObjectId = String
		throw Error('you can edit only  your stores');
	}
}

exports.updateStore = async(req, res) => {
	// 1. find and update store
	var query = {_id: req.params.id};
	var data = req.body;
	var options = {
		new: true,
		runValidators: true
	};
	const store = await Store.findOneAndUpdate(query, data , options).exec();
	req.flash('success',`Succesfully updated <strong> ${store.name} </strong> . <a href="/stores/${store.slug}"> View Store </a>`);
	res.redirect(`/stores/${store._id}/edit`);
}


exports.getStoreBySlug = async(req, res, next) => {
	var slug = req.params.slug;
	// console.log(slug);
	const store = await Store.findOne({slug: slug}).
	populate('author reviews');
	//res.json(store);
	if(!store) return next();

	res.render('store', {store});
};


exports.getStoreByTag = async(req, res) => {
	const tag = req.params.tag;
	// const tags = await Store.getTagList();
	// res.json(tags);

	const tagQuery = tag || { $exists: true };

	const tagsPromise = Store.getTagList();
	const storePromise = Store.find({ tags : tagQuery });
	const [tags, stores] = await Promise.all([tagsPromise, storePromise]);
	// var tags = result[0];
	// var stores = result[1];
	// res.json(stores);
	// res.json(stores);
	res.render('tag', {tags, title: 'Tags', stores });
};

exports.searchStores = async (req, res ) => {
	// res.json({it:'works'});
	// res.json(req.query);
	
	/*
	 * Results are displayed by creation date By default
	 * $meta : 'textScore' is to know the result with more found words on it
	 */

	const stores = await Store.find({
		$text: {
			$search: req.query.q
		}
	}, {
		score: { $meta : 'textScore'} // project score field
	})
	// sort
	.sort({
		score: { $meta : 'textScore'}
	})
	// limit 5 results
	.limit(5);
	res.json(stores);

}

exports.mapStores = async (req, res ) =>{
	// res.json(req.query);
	const coordinates = [req.query.lng, req.query.lat].map(parseFloat); // transform real numbers
	const q = {
		location: {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates
				},
				// $maxDistance: 1000 //10 km
			}
		}
		
	};
	const stores = await Store.find(q).select('slug name description location photo').limit(10); // include fields
	// const stores = await Store.find(q).select('-photo -name'); // to exclude fields
	res.json(stores);
}

exports.mapPage = async (req, res) => {
	res.render('map', {title: 'Map'});
}


exports.heartStore = async (req, res) =>{
	const hearts = req.user.hearts.map(obj => obj.toString());
	const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'; 
	// pull to remove from list | addToSet to add without duplicates
	const user = await User
	.findByIdAndUpdate(
		req.user._id,
		{ [operator] : { hearts: req.params.id } }, 
		{ new : true } // to return user object updated and not a previous statemnt 
	);
	res.json(user);
}

exports.getHearts = async (req, res ) => {
	const stores = await Store.find({
		_id : { $in : req.user.hearts}
	});
	res.render('stores', {title: 'Hearted Stores', stores});

}


exports.getTopStores = async (req, res) => {
	const stores = await Store.getTopStores(); // complex queries are handled form the model not the controller
	// res.json(stores);
	res.render('topStores', {stores, title: "Tops Stores !"});
}





