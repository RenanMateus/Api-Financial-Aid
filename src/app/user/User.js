const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');

const Schema = mongoose.Schema;
const env = require('dotenv').config({path:'./config/.env'}).parsed;


const UserSchema = new Schema({
    active:{type:Boolean, default:true},
    email: {type:String, required:true},
    name: {type:String, required:true},
    password: {type:String, min:8, max: 30, required: true, select: true},
    birthday: {type:Date, required:false},
    gender: {type:String, required:false},
    cpf: {type:String, required:false},
    identityNumber:  {type:String, required:false},
    cep:  {type:String, required:false},
    publicPlace: {type:String, required:false},
    number: {type:String, required:false},
    compl: {type:String, required:false},
    country: {type:String, required:false},
    state: {type:String, required:false}
});


UserSchema.index({"$**":'text'});

UserSchema.methods.gerarSenha = senha =>{
    return bcrypt.hashSync(senha, bcrypt.genSaltSync(9));
}
UserSchema.methods.validarSenha = (senha, hash) =>{
    return bcrypt.compareSync(senha, hash);
}
UserSchema.methods.gerarToken = (user) =>{
    let payload = {
        id: user._id,
        name: user.name,
        email: user.email
    }
    return jwt.sign({payload}, env.SECRET_KEY, {
        expiresIn:'30 day'
    });
}

module.exports = mongoose.model('User', UserSchema);