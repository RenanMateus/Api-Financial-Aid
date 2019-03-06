'use strict'

const User = require('./User');
const path = require('path');
const nodemailer = require('nodemailer');
const emailRegex = /\S+@\S+\.\S+/;
const express = require('express');
const router = express.Router();



function authRouter() {

    router.post('/register', async (req, res) => {        
        const { email, password, name } = req.body;

        try {
            if (!email.match(emailRegex)) //Confirindo expressão regular CONFERIR
                return res.status(400).send({ error: { message: 'O e-mail informado é inválido!' } });

            if (await User.findOne({ email }))
                return res.status(409).send({ error: { message: 'Usuário já cadastrado!' } });

            let user = new User();
            user.email = email;
            user.name = name;
            user.password = user.gerarSenha(password);
            user = await user.save();

            return res.status(201).send({
                _id: user._id,
                login: user.login,
                email: user.email,
                name: user.name,               
                token: user.gerarToken(user) 
            });

        } catch (error) {
            console.log(error);
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {

            const user = await User.findOne({ email }).select('+password');

            if (!user)
                return res.status(401).send({ error: { message: 'Usuário inválidos' } });

            if (!await user.validarSenha(password, user.password))
                return res.status(401).send({ error: { message: 'Usuário/Senha inválidos' } });

            user.password = undefined;

            res.status(200).send({
                _id: user._id,
                active: user.active,
                email: user.email,
                name: user.name,
                token: user.gerarToken(user),
            });

        } catch (error) {
            return res.status(400).send({ error: { message: 'Erro ao tentar fazer login' } })
        }

    })
    return router;
}

module.exports = authRouter;
