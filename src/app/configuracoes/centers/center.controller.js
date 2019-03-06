'use strict'

const Center = require('./Center');
const express = require('express');
const router = express.Router();
const auth = require('../../service/auth');
const Busca = require('../../service/search');

function centerRouter() {

    router.post('/center', auth, async (req, res) => {
        try {
            const { 
                name,
                revenue,
                cost
            } = req.body;
            
            var _user = req.payload.id;

            if (await Center.findOne({ name:name, _owner:_user }))
                return res.status(409).send({ error: { message: 'Centro já cadastrada!' } });
            
            let center = new Center();
            center._owner = _user;
            center.name = name;
            center.revenue = revenue;
            center.cost = cost;

            center = await center.save();

            return res.status(201).send(center);
        } catch (err) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.put('/center/:id', auth, async (req, res) => {
        try {
            const { 
                name,
                revenue,
                cost
            } = req.body;
            
            var _user = req.payload.id;

            const registered = await Center.findOne({ name:name, _owner:_user });
            
            if(registered && registered._id != req.params.id)
                return res.status(409).send({ error: { message: 'Centro já cadastrado!' } });
            
            const center = await Center.findByIdAndUpdate(req.params.id, {
                name,
                revenue,
                cost
            }, { new: true });

            return res.send(center);
        } catch (err) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/center/:id', auth, async (req, res) => {
        try {
            var _user = req.payload.id;

            const center = await Center.findOne({_id:req.params.id, _owner:_user});
            if (!center)
                return res.status(404).send({ error: { message: 'Erro ao buscar centro' } });
            return res.status(200).send(center);
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/centers/:page?', auth, async (req, res) => {
        try {
            const page = parseInt(req.params.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;

            var _user = req.payload.id;

            await Center.find({_owner:_user}).sort('name').paginate(page, limit, (error, result, total) => {
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

    router.delete('/center/:id', auth, async (req, res) => {
        try {
            var _user = req.payload.id;

            Center.findOne({_id:req.params.id, _owner:_user}, async (err, center) => {
                if(err)
                    return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
                if(!center)
                    return res.status(204).send({ error: { message: 'Centro não cadastrada' } });
                
                await Center.findByIdAndRemove(center._id);
                res.status(200).send({result: {message: 'Centro Apagada'}});
            });
            
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/center-search/:page?', auth, async (req, res) => {
        try {
            
            var text = req.query.text || "";
            const page = parseInt(req.params.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;
            
            var consulta = {_owner : req.payload.id};

            if(text!=""){
                consulta.$text = { $search: text };
            }

            Center.find(consulta).sort('name').paginate(page, limit, (error, result , total) =>{
                if(error)
                    res.send(error);
                else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
            });
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/revenue-center', auth, async (req, res) => {
        const text = req.query.text;
        const limit = parseInt(req.query.limit, 10) || 5;
        const page = 1;

        var _user = req.payload.id;

        if(text){
            Center.find( { $text: { $search: text} , revenue:true, _owner:_user } ).paginate(page, limit,  (error, result , total) =>{
                if(error)
                    res.send(error);
                else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
            });
        }else{
            Center.find({revenue:true, _owner:_user}).paginate(page, limit, (error, result , total) =>{
                if(error)
                    res.send(error);
                else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
            });
        }
    });

    router.get('/cost-center', auth, async (req, res) => {
        const text = req.query.text;
        const limit = parseInt(req.query.limit, 10) || 5;
        const page = 1;
        //testando os commits
        var _user = req.payload.id;

        if(text){
            Center.find( { $text: { $search: text} , cost:true, _owner:_user } ).paginate(page, limit,  (error, result , total) =>{
                if(error)
                    res.send(error);
                else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
            });
        }else{
            Center.find({cost:true, _owner:_user}).paginate(page, limit, (error, result , total) =>{
                if(error)
                    res.send(error);
                else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
            });
        }
    });

    return router;
};

module.exports = centerRouter;
