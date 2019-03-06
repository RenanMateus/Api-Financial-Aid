const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BillSchema = new Schema({
    _owner:{type:Schema.ObjectId, ref:'User', required:true},
    credit: {type:Boolean, required:true},
    type: {type:String, enum:[
        'Normal',
        'Recorrente', 
        'Parcelada'
    ], required:true},
    ok: {type: Boolean, required:true},
    value: {type:Number, required:true},
    dueDate:{type:Date, required:true},
    installmentTotal:{type:Number, required:false},
    installment:{type:Number, required:false},
    _installmentRef:{type:Schema.ObjectId, ref:'Parcelamento', required:false},
    payday:{type:Date, required:false},
    description: {type:String, required:false},
    forfeit:{type:Number, required:false, default:0},       //Multa
    interestRate:{type:Number, required:false, default:0},  //Juros
    discount:{type:Number, required:false, default:0},      //Desconto
    total:{type:Number, required:false, default: 0},        //Total Pago
    _category: {type:Schema.ObjectId, ref:'Category'},
    docNumber: {type:String, required:false},
    docDate:{type:Date, required:false},
    _partner: {type:Schema.ObjectId, ref:'Partner'},
    _center: {type:Schema.ObjectId, ref:'Center'},
    month: {type:Date, required: false},
    observation:{type:String, required:false},
    _conciliation:{type:Schema.ObjectId, ref:'Conciliation', default:null},
    file:{type: String, required: false}
});


BillSchema.index({"$**":'text'});
module.exports = mongoose.model('Bill', BillSchema);