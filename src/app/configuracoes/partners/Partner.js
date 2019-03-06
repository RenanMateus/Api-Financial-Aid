const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const PartnerSchema = new Schema({
    _owner:{type: Schema.ObjectId, ref: 'User', required:true},
    name: {type:String, required:true},
    telefone:{type:String, required:false},
    registerNumber: {type:String, required:true},
    email: {type:String, required:false},
    site: {type:String, required:false},
    observation: {type:String, required:false},
    cep: {type:String, required:false},
    address: {type:String, required:false},
    number: {type:String, required:false},
    address2: {type:String, required:false},
    district: {type:String, required:false},
    city: {type:String, required:false},
    state: {type:String, required:false},
    country: {type:String, required:false},
    type: {type:String, required:true},
    client: {type:Boolean, required:true},
    provider: {type:Boolean, required:true}
});

PartnerSchema.index({"$**":'text'});

module.exports = mongoose.model('Partner', PartnerSchema);