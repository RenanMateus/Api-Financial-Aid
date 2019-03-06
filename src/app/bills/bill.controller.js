'use strict'

const Account = require('../account/Account');
const Transaction = require('../account/Transaction');
const Category = require('../configuracoes/category/Category');
const Center = require('../configuracoes/centers/Center');
const Partner = require('../configuracoes/partners/Partner');
const Bill = require('./Bill');
const Parcelamento = require('./Parcelamento');
const auth = require('../service/auth');

const express = require('express');
const router = express.Router();
const paginate = require('mongoose-pagination');
const Busca = require('../service/search');

function billRouter() {

    router.post('/bill', auth, async (req, res) => {
        try {
            const { 
                credit,
                type,
                ok,
                value,
                dueDate,
                payday,
                installmentTotal,
                description,
                forfeit,
                interestRate,
                discount,
                total,
                _category,
                docNumber,
                docDate,
                _partner,
                _center,
                month,
                observation
            } = req.body;
            
            const _user = req.payload.id;

            let bill = new Bill();
            bill._owner = _user;
            bill.credit = credit;
            bill.type = type;

            var recorrente = false;
            switch (type) {
                case 'Normal':
                    break;
                case 'Recorrente':
                    recorrente = true;
                case 'Parcelada':
                    var quantidadeMeses;

                    if (recorrente){
                        quantidadeMeses = 36;       //Repete por 3 anos
                    }else{
                        quantidadeMeses = installmentTotal;
                    }


                    let parcelamento = Parcelamento();
                    parcelamento._owner = _user;
                    parcelamento = await parcelamento.save();

                    for (let index = 1; index <= quantidadeMeses; index++) {
                        let billInstallment = new Bill();
                        billInstallment._owner = _user;
                        billInstallment.credit = credit;
                        billInstallment.type = type;
                        billInstallment.ok = ok;
                        billInstallment.value = value;
                        
                        billInstallment.dueDate = new Date(dueDate);

                        let aux = new Date(dueDate);

                        billInstallment.dueDate.setMonth(billInstallment.dueDate.getMonth()+(index-1));

                        let temp = index;

                        while(temp>12){
                            temp = temp - 12;
                        }

                        if((aux.getMonth()+temp-1 == billInstallment.dueDate.getMonth())){
                            
                        }else{
                            billInstallment.dueDate.setDate(billInstallment.dueDate.getDate()-billInstallment.dueDate.getDate());
                        }

                        billInstallment.payday = payday;
                        billInstallment.description = description;
                        billInstallment.forfeit = forfeit;
                        billInstallment.interestRate = interestRate;
                        billInstallment.discount = discount;
                        billInstallment.total = total;
                        billInstallment._category = _category;
                        billInstallment.docNumber = docNumber;
                        billInstallment.docDate = docDate;
                        billInstallment._partner = _partner;
                        billInstallment._center = _center;
                        billInstallment.month = month;
                        billInstallment.observation = observation;

                        billInstallment.installmentTotal = quantidadeMeses;
                        billInstallment.installment = index;
                        billInstallment._installmentRef = parcelamento._id;

                        billInstallment = await billInstallment.save();
                    }

                    return res.sendStatus(201);
                    //Criar todas as contas em uma lista

                    break;
                default:
                    return res.status(400).send({ error: { message: 'BAD REQUEST' } });
            }
            bill.ok = ok;
            bill.value = value,
            bill.dueDate = dueDate;
            bill.payday = payday;
            bill.description = description;
            bill.forfeit = forfeit;
            bill.interestRate = interestRate;
            bill.discount = discount;
            bill.total = total;
            bill._category = _category;
            bill.docNumber = docNumber;
            bill.docDate = docDate;
            bill._partner = _partner;
            bill._center = _center;
            bill.month = month;
            bill.observation = observation;

            bill = await bill.save();

            return res.status(201).send(bill);
        } catch (err) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.put('/bill/:id', auth, async (req, res) => {
        try {
            const { 
                credit,
                type,
                ok,
                value,
                dueDate,
                payday,
                description,
                forfeit,
                interestRate,
                discount,
                total,
                _category,
                docNumber,
                docDate,
                _partner,
                _center,
                month,
                observation
            } = req.body;
            
            const _user = req.payload.id;

            const bill = await Bill.findOneAndUpdate({_id:req.params.id, _owner:_user}, {
                credit,
                type,
                ok,
                value,
                dueDate,
                payday,
                description,
                forfeit,
                interestRate,
                discount,
                total,
                _category,
                docNumber,
                docDate,
                _partner,
                _center,
                month,
                observation
            }, { new: true });

            return res.send(bill);
        } catch (err) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/bill/:id', auth, async (req, res) => {
        try {
            const _user = req.payload.id;

            const bill = await Bill.findOne({_id:req.params.id, _owner:_user}).populate('_category _center _partner');
            if (!bill)
                return res.status(404).send({ error: { message: 'Erro ao buscar conta' } });
            return res.status(200).send(bill);
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/bills/:page?', auth, async (req, res) => {


        try {
            const sort = req.query.sort || 'dueDate';
            const page = parseInt(req.params.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;
            const credit = req.query.credit;

            const _user = req.payload.id;

            await Bill.find({credit:credit, _owner:_user}).sort(sort).populate('_category _center _partner').paginate(page, limit, (error, result, total) => {
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

    router.delete('/bill/:id', auth, async (req, res) => {
        try {

            const _user = req.payload.id;

            await Bill.findOneAndRemove({_id:req.params.id, _owner:_user}, async (err, bill) => {
                if(err)
                    return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
                if(!bill)
                    return res.status(204).send({ error: { message: 'Conta não cadastrada' } });
                if (bill.type == "Parcelada") {
                    var prestacoes = await Bill.find({_installmentRef:bill._installmentRef}).sort('dueDate');
                    
                    let i = 1;
                    prestacoes.forEach(async element => {
                        element.installmentTotal = prestacoes.length;
                        element.installment = i;
                        i++;
                        
                        await Bill.findOneAndUpdate({_id:element._id, _owner:_user}, element);
                    });
                }
                res.status(200).send({result: {message: 'Conta Apagada'}});
            });
            
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/bill-search/:page?', auth, async (req, res) => {
        try {
            
            const _user = req.payload.id;

            var text = req.query.text || undefined;
            var page = parseInt(req.params.page) || 1;
            var limit = parseInt(req.query.limit) || 10;
            const credit = req.query.credit || undefined;
            const start = new Date (req.query.start);
            const end = new Date (req.query.end);
            const conciliation = req.query.conciliation || false;
            
            var consulta = {};

            if(text){

                
                if(credit == undefined){
                    if(conciliation){
                        consulta = {dueDate: {$gte:start, $lte:end}, $text: { $search: text }, _conciliation:null, _owner:_user }
                    }else{
                        consulta = {dueDate: {$gte:start, $lte:end}, $text: { $search: text }, _owner:_user }
                    }
                }else{
                    if(conciliation){
                        consulta = {dueDate: {$gte:start, $lte:end}, credit:credit, $text: { $search: text }, _conciliation:null, _owner:_user }
                    }else{
                        consulta = {dueDate: {$gte:start, $lte:end}, credit:credit, $text: { $search: text }, _owner:_user }
                    }
                }

                Bill.find( consulta ).populate('_category _center _partner').sort({dueDate:-1}).paginate(page, limit,  (error, result , total) =>{
                    if(error)
                        res.send(error);
                    else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
                });
            }else{

                
                if(credit == undefined){
                    if(conciliation){
                        consulta = {dueDate: {$gte:start, $lte:end}, _conciliation:null, _owner:_user }
                    }else{
                        consulta = {dueDate: {$gte:start, $lte:end}, _owner:_user }
                    }
                }else{
                    if(conciliation){
                        consulta = {dueDate: {$gte:start, $lte:end}, credit:credit, _conciliation:null, _owner:_user }
                    }else{
                        consulta = {dueDate: {$gte:start, $lte:end}, credit:credit, _owner:_user }
                    }
                }


                Bill.find( consulta ).populate('_category _center _partner').sort({dueDate:-1}).paginate(page, limit, (error, result , total) =>{
                    if(error)
                        res.send(error);
                    else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
                });
            }
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });
    
    return router;
};

module.exports = billRouter;
