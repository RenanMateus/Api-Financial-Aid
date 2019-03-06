const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ParcelamentoSchema = new Schema({
    _owner:{type:Schema.ObjectId, ref:'User', required:true},
});


ParcelamentoSchema.index({"$**":'text'});
module.exports = mongoose.model('Parcelamento', ParcelamentoSchema);