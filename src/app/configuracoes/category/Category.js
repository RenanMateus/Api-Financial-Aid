const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const CategorySchema = new Schema({
    _owner:{type: Schema.ObjectId, ref: 'User', required:true},
    name: {type:String, required:true},
    _dad: {type: Schema.ObjectId, ref: 'Category', required:false},
    subcategories: []
});

CategorySchema.index({"$**":'text'});

module.exports = mongoose.model('Category', CategorySchema);