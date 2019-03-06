'use strict'

const User = require('./User');
const express = require('express');
const router = express.Router();
const paginate = require('mongoose-pagination');
const multer = require('multer');
const getImage = require('../service/getImage');
const auth = require('../service/auth');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './uploads/users/')
    },
    filename: function (req, file, callback) {
        var ext = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
        callback(null, file.fieldname + '-' + Date.now() + '.' + ext)
    }, limits: {
        files: 1,
        fileSize: 5000000
    }
});

const upload = multer({ storage });

function userRouter() {

    router.put('/user/:id', auth, async (req, res) => {
        try {
            const { 
                active, 
                email, 
                name,
                birthday,
                gender,
                cpf,
                identityNumber,
                cep,
                publicPlace,
                number,
                compl,
                country,
                state
            } = req.body;

            const user = await User.findByIdAndUpdate(req.params.id, {
                active,
                email,
                name,
                birthday,
                gender,
                cpf,
                identityNumber,
                cep,
                publicPlace,
                number,
                compl,
                country,
                state
            }, { new: true });

            return res.send(user);
        } catch (err) {
            return res.status(400).send({ error: { message: 'Erro ao atualizar usuário' } });
        }
    });

    router.get('/user/:id', auth, async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user)
                return res.status(404).send({ error: { message: 'Erro ao buscar usuário' } });
            return res.status(200).send(user);
        } catch (error) {
            return res.status(400).send({ error: { message: 'Erro ao buscar usuário' } });
        }
    });

    router.get('/users/:page?', auth, async (req, res) => {

        try {
            const page = parseInt(req.params.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;


            await User.find().sort('name').paginate(page, limit, (error, result, total) => {
                if (error) {
                    return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
                }
                const docs = {
                    result: result,
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
                return res.status(200).send(docs);
            });


        } catch (error) {
            console.log(error);
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.put('/user-password/:_id', auth, async (req, res) => {
       
        try{
            let id = req.params._id;
            let password = req.body.password;
            let newPassword = req.body.newPassword;
        
            User.findOne({_id: id}, (erro, usuario) =>{
                if(erro)
                    return res.status(500).send({message:'Erro interno de servidor!'});
                else if(usuario)
                    if(usuario.validarSenha(password, usuario.password)){
                        User.findByIdAndUpdate(id, {password:usuario.gerarSenha(newPassword)}, function(err, result){
                            if(err) return res.status(500).send({message:'Erro ao alterar a senha!'})
                            else return res.status(200).send({message:'Senha alterada com sucesso!'})
                        })
                    }
                    else
                        return res.status(401).send({message:'Usuário/Senha não autorizado!'});
                    else 
                        return res.status(401).send({message:'Usuário/Senha não autorizado!'});
                        //Verificar este retorno, usuário não existe no banco
            });
        }catch (error){
            console.log(error);
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    
    })

    return router;
}

module.exports = userRouter;
