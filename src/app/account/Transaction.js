const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
    _owner:{type: Schema.ObjectId, ref: 'User', required:true},        
    _account:{type: Schema.ObjectId, ref: 'Account', required:true},
    credit: {type:Boolean, required:true},
    value: {type:Number, required:true},
    description: {type:String, required:false},
    date: {type:Date, required:true},
    _category: {type:Schema.ObjectId, ref:'Category', required:false},
    docNumber: {type:String, required:false},
    _partner: {type:Schema.ObjectId, ref:'Partner', required:false},
    _center: {type:Schema.ObjectId, ref:'Center', required:false},
    _conciliation:{type:Schema.ObjectId, ref:'Conciliation', default:null}
});


TransactionSchema.index({"$**":'text'});
module.exports = mongoose.model('Transaction', TransactionSchema);