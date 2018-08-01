const mongoose = require ('mongoose');
mongoose.Promise = global.Promise;

const slug = require ('slugs');

const storeSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: 'Please enter a Store name'
	},
	slug: String,
	description:{
		type: String,
		trim: true,
	},
	tags: [String],
	created: {
		type: Date,
		default: Date.now
	},
	location: {
		type: {
			type: String,
			default: 'Point'
		},
		coordinates: [{
			type: Number,
			required: "You must supply coordinates"
		}],
		address: {
			type: String,
			required: "You must supply address"
		}
	},
	photo: String,
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: 'You must supply an author'
	}
},{
	// Attach virtual information to the Store object automatically
	toJSON: {virtuals: true},
	toObject: {virtuals: true}
});

// Define index
storeSchema.index({
	// compound index
	// use $text on mongo queries
	name: 'text',
	description: 'text', // text is the type of posible searches
});

storeSchema.index({
	location : '2dsphere'
});


storeSchema.pre('save', async function(next){
	if(!this.isModified('name')){
		// skip it
		next();
		return;
	}
	this.slug = slug(this.name);

	// find stores with slug alike.. attach a number to it a-1, a-2
	const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i'); //
	const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
	if (storesWithSlug.length) {
		this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
	}
	next();
	// TODO : validation for no repeated slug
});

storeSchema.statics.getTagList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
}

storeSchema.statics.getTopStores = function() {
	return this.aggregate([
		// * 1. look stores and populate reviews
		{ $lookup: {
			from: 'reviews', localField: '_id', foreignField: 'store' , as: 'reviews'
		}},
		// * 2. filter items with 2 or more reviews
		{ $match: {'reviews.1': {$exists: true}}}, // review.1 is the index (.1 = secomd review)
		// * 3. add avarage reviews field
		{ $project : { // addField ??
			photo: '$$ROOT.photo', 
			name: '$$ROOT.name',
			reviews: '$$ROOT.reviews',
			slug: '$$ROOT.slug',
			averageRating: { $avg: '$reviews.rating'}
		}}, // add aditional field. TODO : check how to do this with new mongo version
		
		// * 4. sort by new fiels , highest reviews first
		{ $sort: { averageRating: -1 }},
		// * 5. limit to at most 10
		{ $limit : 10}
	]); // this returns a promes
}


// virtual populate
// find reviews where the store _id === reviews store property
storeSchema.virtual('reviews', {
	ref: 'Review', // waht model to link
	localField : "_id",  // field on store
	foreignField: 'store'  // which  fiel don the review
});

function autopopulate(next) {
	this.populate('reviews');
	next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);
