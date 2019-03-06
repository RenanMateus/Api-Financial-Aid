'use strict'

const Partner = require('./Partner');
const express = require('express');
const router = express.Router();
const Busca = require('../../service/search');
const auth = require('../../service/auth');

function partnerRouter() {

    router.post('/partner', auth, async (req, res) => {
        try {
            const { 
                name,
                telefone,
                registerNumber,
                email,
                site,
                observation,
                cep,
                address,
                number,
                address2,
                district,
                city,
                state,
                country,
                type,
                client,
                provider
            } = req.body;
            
            var _user = req.payload.id;

            if (await Partner.findOne({ registerNumber:registerNumber, _owner:_user }))
                return res.status(409).send({ error: { message: 'Parceiro já cadastrado!' } });
            
            let partner = new Partner();
            partner._owner = _user;
            partner.name = name;
            partner.telefone = telefone;
            partner.registerNumber = registerNumber;
            partner.email = email;
            partner.site = site;
            partner.observation = observation;
            partner.cep = cep;
            partner.address = address;
            partner.number = number;
            partner.address2 = address2;
            partner.district = district;
            partner.city = city;
            partner.state = state;
            partner.country = country;
            partner.type = type;
            partner.client = client;
            partner.provider = provider;

            

            partner = await partner.save();

            return res.status(201).send({
                _id: partner._id,
                name: partner.name,
                telefone: partner.telefone,
                registerNumber: partner.registerNumber,
                email: partner.email,
                site: partner.site,
                observation: partner.observation,
                cep: partner.cep,
                address: partner.address,
                number: partner.number,
                address2: partner.address2,
                district: partner.district,
                city: partner.city,
                state: partner.state,
                country: partner.country,
                type: partner.type,
                client: partner.client,
                provider: partner.provider 
            });
        } catch (err) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.put('/partner/:id', auth, async (req, res) => {
        try {
            const { 
                name,
                telefone,
                registerNumber,
                email,
                site,
                observation,
                cep,
                address,
                number,
                address2,
                district,
                city,
                state,
                country,
                type,
                client,
                provider
            } = req.body;

            var _user = req.payload.id;

            const registered = await Partner.findOne({ registerNumber:registerNumber, _owner:_user })
            
            if(registered && registered._id != req.params.id)
                return res.status(409).send({ error: { message: 'CPF/CNPJ já cadastrado!' } });

            const partner = await Partner.findByIdAndUpdate(req.params.id, {
                name,
                telefone,
                registerNumber,
                email,
                site,
                observation,
                cep,
                address,
                number,
                address2,
                district,
                city,
                state,
                country,
                type,
                client,
                provider
            }, { new: true });

            return res.send(partner);
        } catch (err) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/partner/:id', auth, async (req, res) => {
        try {
            var _user = req.payload.id;
            const partner = await Partner.findOne({_id:req.params.id, _owner:_user});
            if (!partner)
                return res.status(404).send({ error: { message: 'Erro ao buscar parceiro' } });
            return res.status(200).send(partner);
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/partners/:page?', auth, async (req, res) => {

        try {
            const page = parseInt(req.params.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;
            const sort = req.query.sort;
            var _user = req.payload.id;

            await Partner.find({_owner:_user}).sort(sort).paginate(page, limit, (error, result, total) => {
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
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.delete('/partner/:id', auth, async (req, res) => {
        try {
            var _user = req.payload.id;
            Partner.findOne({_id:req.params.id, _owner:_user}, async (err, partner) => {
                if(err)
                    return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
                if(!partner)
                    return res.status(204).send({ error: { message: 'Parceiro não cadastrado' } });
                await Partner.findByIdAndRemove(partner._id);
                return res.status(200).send({result: {message: 'Parceiro Apagado'}});
            });
            
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/partner-search/:page?', auth, async (req, res) => {
        try {
            var text = req.query.text || "";
            const page = parseInt(req.params.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;
            
            var consulta = {_owner : req.payload.id};

            if(text!=""){
                consulta.$text = { $search: text };
            }

            Partner.find(consulta).sort('name').paginate(page, limit, (error, result , total) =>{
                if(error)
                    res.send(error);
                else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
            });
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/client-partner', auth, async (req, res) => {
        const text = req.query.text;
        const limit = parseInt(req.query.limit, 10) || 5;
        const page = 1;

        var _user = req.payload.id;

        if(text){
            Partner.find( { $text: { $search: text} , client:true, _owner:_user } ).paginate(page, limit,  (error, result , total) =>{
                if(error)
                    res.send(error);
                else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
            });
        }else{
            Partner.find({client:true, _owner:_user}).paginate(page, limit, (error, result , total) =>{
                if(error)
                    res.send(error);
                else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
            });
        }
    });

    router.get('/provider-partner', auth, async (req, res) => {
        const text = req.query.text;
        const limit = parseInt(req.query.limit, 10) || 5;
        const page = 1;

        var _user = req.payload.id;

        if(text){
            Partner.find( { $text: { $search: text} , provider:true, _owner:_user } ).paginate(page, limit,  (error, result , total) =>{
                if(error)
                    res.send(error);
                else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
            });
        }else{
            Partner.find({provider:true, _owner:_user}).paginate(page, limit, (error, result , total) =>{
                if(error)
                    res.send(error);
                else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
            });
        }
    });

    return router;
};

module.exports = partnerRouter;
