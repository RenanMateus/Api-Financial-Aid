const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const UploadFileBillSchema = new Schema({
	_owner:{type: Schema.ObjectId, ref: 'User', required:true},
	name: { type: String, required: true },
	size: { type: String, required: true },
	type: { type: String, required: true },
	_bill: { type: Schema.ObjectId, ref: 'Bill', required: true }
}, {timestamps: true});

module.exports = mongoose.model('UploadFileBill', UploadFileBillSchema);
