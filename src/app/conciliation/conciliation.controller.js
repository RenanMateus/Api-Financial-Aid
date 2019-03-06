'use strict'

const Account = require('../account/Account');
const Transaction = require('../account/Transaction');
const Bill = require('../bills/Bill');
const Category = require('../configuracoes/category/Category');
const Center = require('../configuracoes/centers/Center');
const Partner = require('../configuracoes/partners/Partner');
const Conciliation = require('./Conciliation');
const express = require('express');
const router = express.Router();
const paginate = require('mongoose-pagination');
const Busca = require('../service/search');
const auth = require('../service/auth');

function conciliationRouter() {

    router.post('/conciliation', auth, async (req, res) => {
        try {
            const _user = req.payload.id;

            const {
                _transaction,
                _bill
            } = req.body;

            var conciliation = new Conciliation();
            conciliation._owner = _user;
            conciliation = await conciliation.save();

            await Transaction.findByIdAndUpdate({_id:_transaction, _owner:_user}, {$set: {_conciliation:conciliation._id}});
            await Bill.findByIdAndUpdate({_id:_bill, _owner:_user}, {$set: {_conciliation:conciliation._id}});

            return res.sendStatus(201);
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.delete('/conciliation/:id', auth, async (req, res) => {
        try {
            const _user = req.payload.id;

            const _id = req.params.id;

            await Conciliation.findOneAndRemove({_id:_id, _owner:_user});

            await Transaction.findOneAndUpdate({_conciliation:_id, _owner:_user}, {$set: {_conciliation:null}});
            await Bill.findOneAndUpdate({_conciliation:_id, _owner:_user}, {$set: {_conciliation:null}});

            res.sendStatus(200);
        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/conciliation/:id', auth, async (req, res) => {
        try {
            const _user = req.payload.id;

            const _id = req.params.id;

            var transaction = await Transaction.findOne({_conciliation:_id, _owner:_user}).populate('_center _category _account _center');


            var bill = await Bill.findOne({_conciliation:_id, _owner:_user}).populate('_center _category _account _center');

            return res.status(200).send({
                bill: bill,
                transaction: transaction
            });

        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });
    return router;
};

module.exports = conciliationRouter;
