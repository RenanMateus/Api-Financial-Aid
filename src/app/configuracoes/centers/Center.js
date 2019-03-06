const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CenterSchema = new Schema({
    _owner:{type: Schema.ObjectId, ref: 'User', required:true},
    name: {type:String, required:true},
    revenue: {type: Boolean, required: true},
    cost: {type: Boolean, required: true}
});

CenterSchema.index({"$**":'text'});

module.exports = mongoose.model('Center', CenterSchema);