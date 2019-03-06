const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ConciliationSchema = new Schema({
    _owner:{type:Schema.ObjectId, ref:'User', required:true},
});


ConciliationSchema.index({"$**":'text'});
module.exports = mongoose.model('Conciliation', ConciliationSchema);