const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AccountSchema = new Schema({
    _owner:{type: Schema.ObjectId, ref: 'User', required:true},
    name: {type:String, required:true},
    type: {type:String, enum:[
        'Conta Corrente',
        'Dinheiro', 
        'Investimento'
    ],required:true},
    bank: {type:String, required:false, enum: [
        'Banco Bradesco S.A. - 237',
        'Banco Citibank S.A. - 745',
        'Banco do Brasil S.A. - 001',
        'Banco Itaú - S.A. - 341',
        'Banco Nossa Caixa S.A. - 151',
        'Banco Safra S.A - 422',
        'Banco Santander Banespa S.A - 033',
        'Banco Santander S.A. - 351',
        'Caixa Econômica Federal - 104',
        'HSBC Bank Brasil S.A. - Banco Múltiplo - 399'
    ]},
    agency: {type:String, required:false},
    accountNumber: {type: String, required:false},
    balance: {type:Number, required:false, default: 0}
});

AccountSchema.index({"$**":'text'});

module.exports = mongoose.model('Account', AccountSchema);