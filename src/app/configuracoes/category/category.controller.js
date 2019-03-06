'use strict'

const Category = require('./Category');
const Bill = require('../../bills/Bill');
const Transaction = require('../../account/Transaction');
const express = require('express');
const auth = require('../../service/auth');
const router = express.Router();

function categoryRouter() {

    router.post('/category/:id?', auth, async (req, res) => {
        try {
            const id = req.params.id || null;

            const { 
                name
            } = req.body;
            
            var _user = req.payload.id;

            if (await Category.findOne({ name:name, _dad:id, _owner:_user }))
                return res.status(409).send({ error: { message: 'Categoria já cadastrada!' } });
            
            let category = new Category();
            category.name = name;
            category._dad = id;
            category._owner = _user;

            category = await category.save();

            return res.status(201).send(category);
        } catch (err) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.put('/category/:id', auth, async (req, res) => {
        try {
            const name = req.body.name;
            const _dad = req.body._dad || null;

            var _user = req.payload.id;
            
            const registered = await Category.findOne({ name:name, _dad:_dad, _owner:_user });
            
            if(registered && registered._id != req.params.id)
                return res.status(409).send({ error: { message: 'Categoria já cadastrada!' } });

            const category = await Category.findByIdAndUpdate(req.params.id, {
                name
            }, { new: true });

            return res.send(category);
        } catch (err) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/category/:id', auth, async (req, res) => {
        try {
            var _user = req.payload.id;

            const category = await Category.findOne({_id : req.params.id, _owner:_user});
            if (!category)
                return res.status(404).send({ error: { message: 'Erro ao buscar categoria' } });
            return res.status(200).send(category);
        } catch (error) {
            return res.status(400).send({ error: { message: 'Erro ao buscar categoria' } });
        }
    });

    router.get('/categories/:page?', auth, async (req, res) => {
        
        try {
            const page = parseInt(req.params.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;

            var _user = req.payload.id;

            await Category.find({_owner:_user}).sort('name').sort('subcategory').paginate(page, limit, (error, result, total) => {
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

    router.get('/get-categories/:page?', auth, async (req, res) => {
        
        try {
            const page = parseInt(req.params.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;

            var text = req.query.text || "";

            var _user = req.payload.id;
            var consulta = {};
            consulta._owner = _user;

            var re = new RegExp(text, 'i');

            if(text != ""){
                consulta.name = { $regex: re };
            }

            await Category.find(consulta).populate('_dad').sort('name').paginate(page, limit, (error, result, total) => {
                if (error) {
                    return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
                }

                for (let index = 0; index < result.length; index++) {
                    if (result[index]._dad != null){
                        result[index].name = result[index]._dad.name + ' // ' + result[index].name;
                    }  
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


    router.delete('/category/:id', auth, async (req, res) => {
        try {
            var _user = req.payload.id;
            
            Category.findOne({_id:req.params.id, _owner:_user}, async (errCat, category) => {
                if(errCat)
                    return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
                if(!category)
                    return res.status(204).send({ error: { message: 'Categoria não cadastrada' } });
                
                var subcategories = await Category.find({_dad:category._id, _owner:_user});

                //Teste de subcategorias
                let count = 0;

                for (let index = 0; index < subcategories.length; index++) {
                    const element = subcategories[index];
                    count += await Bill.find({_category: element._id, _owner:_user}).count();
                    count += await Transaction.find({_category: element._id, _owner:_user}).count();
                }

                if (count>0){
                    return res.status(400).send({ error: { message: 'Subcategoria(s) sendo utilizadas.'} })
                }
                //Fim de Teste de subcategorias

                var bills = await Bill.find({_category: category._id, _owner:_user});
                var transactions = await Transaction.find({_category: category._id, _owner:_user});

                if(bills.length != 0 || transactions.length != 0){
                    return res.status(400).send({ error: { message: 'Categoria utilizada ' + (bills.length+transactions.length) + ' vez(es).'} })
                }else{
                    await Category.findByIdAndRemove(req.params.id, async (err, category) => {
                        if(err)
                            return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
                        if(!category)
                            return res.status(204).send({ error: { message: 'Categoria não cadastrada' } });
                        
                        res.status(200).send({result: {message: 'Categoria Apagada'}});
                    });
                }
            });
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/category-search/:page?', auth, async (req, res) => {
        try {
            var text = req.query.text || "";
            const page = parseInt(req.params.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;
                        
            var consulta = {_owner : req.payload.id, _dad:null};

            if(text!=""){
                consulta.$text = { $search: text };
            }

            Category.find(consulta).sort('name').paginate(page, limit, async (error, result , total) =>{
                if(error)
                    res.send(error);
                else {
                    var saida = [];

                    for (let index = 0; index < result.length; index++) {
                        var element = result[index];
                        element.subcategories = [];
                        element.subcategories = await Category.find({_dad:element.id});
                        saida.push(element);
                    }

                    return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  saida});
                }
            });
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });
    
    return router;
};

module.exports = categoryRouter;
