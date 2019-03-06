const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const UploadFileTransactionSchema = new Schema({
	_owner:{type: Schema.ObjectId, ref: 'User', required:true},
	name: { type: String, required: true },
	size: { type: String, required: true },
	type: { type: String, required: true },
	_transaction: { type: Schema.ObjectId, ref: 'Transaction', required: true }
}, {timestamps: true});

module.exports = mongoose.model('UploadFileTransaction', UploadFileTransactionSchema);
