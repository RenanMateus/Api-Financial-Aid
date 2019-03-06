'use strict'

const Account = require('../account/Account');
const Transaction = require('../account/Transaction');
const Bill = require('../bills/Bill');
const Category = require('../configuracoes/category/Category');
const Center = require('../configuracoes/centers/Center');
const Partner = require('../configuracoes/partners/Partner');
const Conciliation = require('../conciliation/Conciliation');
const express = require('express');
const router = express.Router();
const paginate = require('mongoose-pagination');
const Busca = require('../service/search');
const auth = require('../service/auth');

function dashboardRouter() {

    router.get('/dashboard', auth, async (req, res) => {
        try {
            const _user = req.payload.id;

            var result = {
                billsToPay : 0,
                billsToReceive : 0,
                balance : 0,
                receivablePastDue : 0,
                payableExpired: 0
            };

            var today = new Date();
            today.setHours(0);
            today.setMinutes(0);
            today.setSeconds(0);
            today.setMilliseconds(0);

            var lastDay = new Date(today);
            lastDay.setDate(1);
            lastDay.setMonth(lastDay.getMonth() + 1);

            var bills = await Bill.find({ok:false, dueDate:{$gte : today, $lt : lastDay}, _owner:_user});

            bills.forEach(element => {
                if(element.credit){
                    result.billsToReceive += element.value;
                }else{
                    result.billsToPay += element.value;
                }
            });

            var accounts = await Account.find({ _owner:_user});

            accounts.forEach(element => {
                result.balance += element.balance;
            });

            bills = await Bill.find({ok:false, dueDate:{$lt : today}, _owner:_user});

            bills.forEach(element => {
                if(element.credit){
                    result.receivablePastDue += element.value;
                }else{
                    result.payableExpired += element.value;
                }
            });


            return res.status(200).send(result);

        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });
    return router;
};

module.exports = dashboardRouter;